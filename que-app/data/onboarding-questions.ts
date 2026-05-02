export type CertificationId = 'ip' | 'fe' | 'spi' | 'boki';

export interface OnboardingChoice {
  id: string;
  text: string;
}

export interface OnboardingQuestion {
  id: string;
  certification: CertificationId;
  question: string;
  choices: OnboardingChoice[];
  correctChoiceId: string;
  explanation: string;
}

export const ONBOARDING_QUESTIONS: Record<CertificationId, OnboardingQuestion> = {
  ip: {
    id: 'onb-ip-01',
    certification: 'ip',
    question:
      'クレジットカードで買い物をしたとき、その決済情報を暗号化して安全に送受信するために広く使われているプロトコルはどれですか？',
    choices: [
      { id: 'a', text: 'FTP' },
      { id: 'b', text: 'SMTP' },
      { id: 'c', text: 'HTTPS' },
      { id: 'd', text: 'DNS' },
    ],
    correctChoiceId: 'c',
    explanation:
      'HTTPS は HTTP に SSL/TLS による暗号化を加えたプロトコルです。ネットショッピングや銀行サイトでアドレス欄に表示される「鍵マーク」がこれにあたります。FTP はファイル転送、SMTP はメール送信、DNS はドメイン名の解決に使われます。',
  },
  fe: {
    id: 'onb-fe-01',
    certification: 'fe',
    question:
      '10進数の「13」を2進数で表すと何になりますか？',
    choices: [
      { id: 'a', text: '1011' },
      { id: 'b', text: '1101' },
      { id: 'c', text: '1110' },
      { id: 'd', text: '1010' },
    ],
    correctChoiceId: 'b',
    explanation:
      '10進数を2進数に変換するには2で割り続けて余りを逆から読みます。13÷2=6余り1、6÷2=3余り0、3÷2=1余り1、1÷2=0余り1。余りを逆に読むと「1101」になります。8+4+0+1=13 で確認できます。',
  },
  spi: {
    id: 'onb-spi-01',
    certification: 'spi',
    question:
      'A、B、Cの3人が1つの仕事を仕上げます。AとBの2人では12日、BとCの2人では15日かかります。A、B、Cの3人全員で取り組むと何日で終わりますか？（AひとりとCひとりの組み合わせは9日とします）',
    choices: [
      { id: 'a', text: '7日' },
      { id: 'b', text: '8日' },
      { id: 'c', text: '9日' },
      { id: 'd', text: '10日' },
    ],
    correctChoiceId: 'a',
    explanation:
      '仕事全体を「1」とします。AB=1/12日、BC=1/15日、AC=1/9日。これらを足すと (A+B)+(B+C)+(A+C)=2(A+B+C)=1/12+1/15+1/9=15/180+12/180+20/180=47/180。よって A+B+C=47/360。3人で1÷(47/360)=360/47≈7.66日。選択肢は整数なので7日が最も近い正解です。',
  },
  boki: {
    id: 'onb-boki-01',
    certification: 'boki',
    question:
      '商品を3万円で販売し、代金は翌月受け取ることにしました。このときの仕訳として正しいものはどれですか？',
    choices: [
      { id: 'a', text: '（借方）現金 30,000 ／（貸方）売上 30,000' },
      { id: 'b', text: '（借方）売掛金 30,000 ／（貸方）売上 30,000' },
      { id: 'c', text: '（借方）売上 30,000 ／（貸方）売掛金 30,000' },
      { id: 'd', text: '（借方）買掛金 30,000 ／（貸方）売上 30,000' },
    ],
    correctChoiceId: 'b',
    explanation:
      '代金を後から受け取る約束なので「売掛金」（資産）が増えます。商品を販売したので「売上」（収益）が増えます。資産の増加は借方、収益の増加は貸方に記録します。現金はまだ受け取っていないので使いません。',
  },
};

export interface OnboardingResult {
  cert: CertificationId;
  correct: boolean;
  completedAt: string;
}

const STORAGE_KEY = 'que_onboarding_result';
const COMPLETED_FLAG_KEY = 'que_onboarding_completed';

export function saveOnboardingResult(result: OnboardingResult): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  localStorage.setItem(COMPLETED_FLAG_KEY, 'true');
}

export function loadOnboardingResult(): OnboardingResult | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as OnboardingResult;
  } catch {
    return null;
  }
}

export function hasCompletedOnboarding(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(COMPLETED_FLAG_KEY) === 'true';
}
