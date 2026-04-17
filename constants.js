const {
  settings: SETTING_POOL,
  emotions: EMOTION_POOL,
  twists: TWIST_POOL,
  ssrKeywords: SSR_POOL = [],
  probabilities: GACHA_PROB
} = window.PROMPT_DATA;

const STORAGE_KEY = "hazel-study-trpg-v5";

const FAILURE_PRAISES = [
  "실패……! 하지만 잘했어요, 조금 더 해 봅시다!"
  "최고, 그래도 3번이나 뭔가 해냈네요!",
  "앗, 이건 운 문제지 당신의 문제가 아니랍니다. 괜찮아요!",
  "괜찮아요, 다시 해 봐요 우리! 조금 더 나아가는 과정이에요.",
  "실패는 결국 데이터가 되어 당신을 도와 줄 거예요!"
];

const FUMBLE_PRAISES = [
  "펌블……! 아프지만, 그래도 괜찮아요. 이번 기회로 다음에 더 잘해 볼까요?",
  "앗, 펌블……. 그래도 낮은 확률을 뚫었네요! 어쩌면 운이 좋은 걸지도?",
  "액땜했네요! 여기서 나쁜 운 다 써 버리고, 시험장에서 잘 보자고요!",
  "괜찮아요, 다시 하면 돼요! 여기서 실패하면 나중에 성공할 거예요!",
  "이런 턴도 있는 거지, 당신이 실패한 건 아니랍니다. 괜찮아요!"
];
