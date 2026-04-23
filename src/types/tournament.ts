export interface Player {
  id: string;
  freePlayerId?: string;
  nickname: string;
  role?: 'pos1' | 'pos2' | 'pos3' | 'pos4' | 'pos5' | 'reserve';
  steamLink: string;
  dotabuffLink: string;
  mmr: number;
  discordUsername: string;
  isCaptain?: boolean;
  isSubstitute?: boolean;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo: string;
  players: Player[];
  status: 'confirmed' | 'pending' | 'disqualified' | 'withdrawn';
  disqualificationReason?: string;
  withdrawalReason?: string;
  groupId?: string;
  titleText?: string;
  titleEmoji?: string;
  titleStyle?: 'legacy' | 'current';
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  date: string;
}

export interface MatchResult {
  team1Score: number;
  team2Score: number;
}

export interface BracketConnection {
  id: string;
  fromMatchId: string;
  toMatchId: string;
  toSlot: 1 | 2;
}

export interface TournamentMatch {
  id: string;
  team1Id: string;
  team2Id: string;
  stage: 'group' | 'playoff-upper' | 'playoff-lower' | 'final';
  format: 'Bo1' | 'Bo2' | 'Bo3';
  groupId?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  result?: MatchResult;
  streamLink?: string;
  round?: number;
  matchNumber?: number;
  nodeX?: number;
  nodeY?: number;
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
  /** e.g. "W*3+D*1+L*0"  — uses W=wins, D=draws, L=losses */
  pointsFormula?: string;
}

export interface PlayoffBracket {
  upperBracket: TournamentMatch[];
  lowerBracket: TournamentMatch[];
  grandFinal?: TournamentMatch;
}

export interface InfoCard { id: string; label: string; desc: string; }
export interface FormatStage { id: string; title: string; desc: string; }
export interface FaqItem { id: string; q: string; a: string; }
export interface StaffMember { id: string; name: string; role: string; }
export interface FreePlayer {
  id: string;
  nickname: string;
  discord: string;
  discordDmLink?: string;
  steam: string;
  dotabuff?: string;
  /**
   * Legacy single role/text. Kept for backwards compatibility with existing data.
   * New UI uses `roles` for multi-select.
   */
  position: string;
  roles?: Array<'carry' | 'mid' | 'offlane' | 'soft' | 'hard'>;
  mmr: number;
  status?: 'free' | 'busy';
}

export interface SiteSettings {
  discordLink: string;
  googleFormLink: string;
  freePlayerFormLink: string;
  /** Moscow time string format: DD-MM-YYYY-HH:mm */
  registrationDeadlineAt: string;
  showRegistrationAlertsOnHome: boolean;
  freePlayersRegistrationClosed: boolean;
  tournamentName: string;
  tournamentDates: string;
  rulesMode: 'page' | 'link';
  rulesLink: string;
  rulesContent: string;
  rulesBannerImage: string;
  contactAdmin1: string;
  contactAdmin2: string;
  heroSubtitle: string;
  /** Подзаголовок на странице «Организаторы» */
  organizersIntro: string;
  aboutText: string;
  aboutText2: string;
  registrationDeadlineText: string;
  registrationHowToText: string;
  registrationRules: string[];
  tournamentCompleted: boolean;
  schedulePreparingText: string;
  scheduleCompletedText: string;
  mvpText: string;
  mvpPrize: string;
  musicUrl: string;
  mvpPlayerId: string;
  mvpMusicUrl: string;
  infoCards: InfoCard[];
  formatStages: FormatStage[];
  faqItems: FaqItem[];
  staffMembers: StaffMember[];
  freePlayers: FreePlayer[];
  contactsList: string[];
  footerCopyright: string;
  maintenanceEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
}

export interface TournamentData {
  teams: Team[];
  news: NewsItem[];
  matches: TournamentMatch[];
  bracketConnections?: BracketConnection[];
  groups: Group[];
  settings: SiteSettings;
}
