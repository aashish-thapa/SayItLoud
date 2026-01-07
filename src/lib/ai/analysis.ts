import Post from '@/models/Post';

// Hugging Face Configuration
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_SENTIMENT_MODEL =
  process.env.HF_SENTIMENT_MODEL || 'cardiffnlp/twitter-roberta-base-sentiment';
const HF_EMOTION_MODEL =
  process.env.HF_EMOTION_MODEL ||
  'j-hartmann/emotion-english-distilroberta-base';
const HF_TOXICITY_MODEL =
  process.env.HF_TOXICITY_MODEL || 'cardiffnlp/twitter-roberta-base-offensive';

const HF_INFERENCE_API_BASE_URL = 'https://router.huggingface.co/hf-inference/models/';

// Local AI Backend Configuration (replaces Gemini)
const LOCAL_AI_BACKEND_URL = process.env.LOCAL_AI_BACKEND_URL || 'http://127.0.0.1:8000';
const LOCAL_AI_API_KEY = process.env.LOCAL_AI_API_KEY;

// Helper to call Hugging Face Inference API
const callHuggingFaceAPI = async (modelId: string, inputs: string) => {
  if (!HF_API_TOKEN) {
    console.error(`Hugging Face API token is missing for model: ${modelId}`);
    throw new Error('Hugging Face API token missing.');
  }

  const response = await fetch(`${HF_INFERENCE_API_BASE_URL}${modelId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HF_API_TOKEN}`,
    },
    body: JSON.stringify({
      inputs: inputs,
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Hugging Face API Error for ${modelId}:`,
      response.status,
      errorText
    );
    throw new Error(`HF API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

interface ScoreItem {
  label: string;
  score: number;
}

type SentimentType = 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | 'Unknown' | 'Error';

// Function to map Hugging Face sentiment scores to custom sentiment labels
const getSentimentLabel = (scores: ScoreItem[]): SentimentType => {
  let maxScore = -1;
  let finalLabel = '';

  for (const item of scores) {
    if (item.score > maxScore) {
      maxScore = item.score;
      finalLabel = item.label;
    }
  }

  if (finalLabel === 'LABEL_0') return 'Negative';
  if (finalLabel === 'LABEL_1') return 'Neutral';
  if (finalLabel === 'LABEL_2') return 'Positive';
  return 'Unknown';
};

// Function to process emotion labels
const getEmotionLabels = (
  scores: ScoreItem[],
  threshold = 0.5
): { emotion: string; score: number }[] => {
  return scores
    .filter((emotion) => emotion.score >= threshold)
    .map((emotion) => ({
      emotion: emotion.label.toLowerCase(),
      score: parseFloat(emotion.score.toFixed(2)),
    }));
};

// Function to process toxicity labels
const getToxicityScores = (
  scores: ScoreItem[] | ScoreItem[][],
  threshold = 0.5
): { detected: boolean; details: Record<string, number> } => {
  const toxicLabels: Record<string, number> = {};
  let isToxic = false;

  const categories = Array.isArray(scores[0]) ? scores[0] : scores;

  if (!Array.isArray(categories)) {
    console.warn(
      'Toxicity model returned unexpected format for categories:',
      scores
    );
    return { detected: false, details: { error: 1 } };
  }

  for (const item of categories as ScoreItem[]) {
    if (item.score >= threshold) {
      const cleanLabel = item.label.toLowerCase().replace(/_/g, ' ');
      toxicLabels[cleanLabel] = parseFloat(item.score.toFixed(2));

      if (cleanLabel === 'offensive') {
        isToxic = true;
      }
    }
  }
  return { detected: isToxic, details: toxicLabels };
};

interface GeminiResult {
  topics: string[];
  summary: string;
  category: string;
  factCheck: 'support' | 'neutral' | 'oppose';
  factCheckReason: string;
}

/**
 * Core function to perform AI analysis on a given post.
 */
export const performAIAnalysisOnPost = async (postId: string) => {
  if (!HF_API_TOKEN) {
    console.error('AI service not configured: Hugging Face API token missing.');
    return null;
  }
  if (!LOCAL_AI_API_KEY) {
    console.error('AI service not configured: LOCAL_AI_API_KEY missing.');
    return null;
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      console.warn(`Post with ID ${postId} not found for AI analysis.`);
      return null;
    }

    const postContent = post.content;

    // Initialize results
    let sentiment: SentimentType = 'Unknown';
    let emotions: { emotion: string; score: number }[] = [];
    let toxicity: { detected: boolean; details: Record<string, number> } = {
      detected: false,
      details: {},
    };
    let topics: string[] = [];
    let summary = '';
    let category = 'Uncategorized';
    let factCheck: 'support' | 'neutral' | 'oppose' | 'Unknown' = 'Unknown';
    let factCheckReason = '';

    // Concurrent API Calls
    const [sentimentPromise, emotionPromise, toxicityPromise, geminiPromise] =
      await Promise.allSettled([
        callHuggingFaceAPI(HF_SENTIMENT_MODEL, postContent),
        callHuggingFaceAPI(HF_EMOTION_MODEL, postContent),
        callHuggingFaceAPI(HF_TOXICITY_MODEL, postContent),
        (async (): Promise<GeminiResult> => {
          const response = await fetch(`${LOCAL_AI_BACKEND_URL}/api/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': LOCAL_AI_API_KEY || '',
            },
            body: JSON.stringify({ content: postContent }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              'Local AI Backend Error:',
              response.status,
              errorText
            );
            throw new Error(
              `Local AI Backend error (${response.status}): ${errorText}`
            );
          }

          return await response.json();
        })(),
      ]);

    // Process results from Promise.allSettled
    if (sentimentPromise.status === 'fulfilled') {
      if (
        Array.isArray(sentimentPromise.value) &&
        Array.isArray(sentimentPromise.value[0])
      ) {
        sentiment = getSentimentLabel(sentimentPromise.value[0]);
      } else {
        console.warn(
          "Unexpected sentiment output format. Using 'Unknown'.",
          sentimentPromise.value
        );
        sentiment = 'Unknown';
      }
    } else {
      console.error('Sentiment Analysis failed:', sentimentPromise.reason);
      sentiment = 'Error';
    }

    if (emotionPromise.status === 'fulfilled') {
      if (
        Array.isArray(emotionPromise.value) &&
        Array.isArray(emotionPromise.value[0])
      ) {
        emotions = getEmotionLabels(emotionPromise.value[0]);
      } else {
        console.warn(
          'Unexpected emotion output format. Using empty array.',
          emotionPromise.value
        );
        emotions = [];
      }
    } else {
      console.error('Emotion Detection failed:', emotionPromise.reason);
      emotions = [];
    }

    if (toxicityPromise.status === 'fulfilled') {
      toxicity = getToxicityScores(toxicityPromise.value);
    } else {
      console.error('Toxicity detection failed:', toxicityPromise.reason);
      toxicity = { detected: false, details: {} };
    }

    if (geminiPromise.status === 'fulfilled') {
      topics = geminiPromise.value.topics || [];
      summary = geminiPromise.value.summary || 'AI summary unavailable.';
      category = geminiPromise.value.category || 'Uncategorized';
      factCheck = geminiPromise.value.factCheck || 'Unknown';
      factCheckReason = geminiPromise.value.factCheckReason || '';
    } else {
      console.error('Local AI analysis failed:', geminiPromise.reason);
      topics = ['AI Error'];
      summary = 'AI summary unavailable.';
      category = 'Error';
      factCheck = 'Unknown';
      factCheckReason = 'Analysis failed.';
    }

    // Override sentiment if toxicity is detected
    if (toxicity.detected) {
      sentiment = 'Mixed';
    }

    // Combine results into aiAnalysis object
    const aiAnalysis = {
      sentiment,
      emotions,
      toxicity,
      topics,
      summary,
      category,
      factCheck,
      factCheckReason,
    };

    // Save the AI analysis results back to the post document
    post.aiAnalysis = aiAnalysis;
    await post.save();

    return post;
  } catch (error) {
    console.error(
      'Server error during overall AI analysis in performAIAnalysisOnPost:',
      error
    );
    return null;
  }
};
