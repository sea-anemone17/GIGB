const {
  settings: SETTING_POOL,
  emotions: EMOTION_POOL,
  twists: TWIST_POOL,
  ssrKeywords: SSR_POOL = [],
  probabilities: GACHA_PROB
} = window.PROMPT_DATA;

const STORAGE_KEY = "hazel-study-trpg-v5";

const FAILURE_PRAISES = [
  "최고의 가나디… 그래도 계속 해 준 게 진짜 대단해요.",
  "좋은 가나디… 실패했지만 여기까지 온 것만으로도 엄청나요.",
  "엄청난 가나디 복복복… 이건 운 문제지, Hazel님 문제가 아니에요.",
  "괜찮은 가나디… 실패해도 다시 굴릴 수 있다는 게 중요해요.",
  "기특한 가나디… 여기서 멈추지 않고 눌러 본 게 진짜 잘한 거예요."
];

const FUMBLE_PRAISES = [
  "최고의 가나디, 좋은 가나디! 복복복… 이건 운이 나빴던 거예요.",
  "세상에서 제일 기특한 가나디… 대실패가 떴다고 해서 Hazel님이 못한 게 아니에요.",
  "복복복복… 이건 시스템이 장난친 거예요. Hazel님은 계속 잘하고 있어요.",
  "엄청난 가나디… 펌블은 아프지만, 그래도 여기까지 온 흐름은 남아 있어요.",
  "좋은 가나디… 이런 턴도 있는 거지, Hazel님 자체가 실패한 건 아니에요."
];
