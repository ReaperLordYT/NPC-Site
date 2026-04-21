import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TournamentData, Team, NewsItem, TournamentMatch, Group, SiteSettings, Player, BracketConnection } from '@/types/tournament';
import {
  fetchTournamentData,
  saveTournamentData,
  signInAdmin,
  signOutAdmin,
  subscribeTournamentUpdates,
  isCurrentUserAdmin,
  listBackups,
  createBackupSnapshot,
  restoreBackupSnapshot,
  deleteBackupSnapshot,
  BackupSnapshot,
} from '@/integrations/supabase/storage';

const defaultRulesContent = `
<p><strong>Blank &nbsp;&nbsp;&nbsp;&nbsp;&middot; &nbsp;&nbsp;&nbsp;&nbsp;"NPC Championship"</strong></p>
<p>NPC Championship — Официальный регламент<br>Все участники обязаны соблюдать данный регламент.</p>
<h2><strong>1. КОМАНДЫ И ИГРОКИ</strong></h2>
<h3><strong>1.1 Состав команды</strong></h3>
<ul>
  <li>Команда состоит из 5 основных игроков.</li>
  <li>Допускается 2 запасных игрока (максимум 7 человек в заявке).</li>
  <li>Указание ролей не требуется — игроки могут менять позиции в любое время.</li>
</ul>
<h3><strong>1.2 Ограничение по MMR</strong></h3>
<ul>
  <li>Максимальный суммарный рейтинг команды: 35 000 MMR.</li>
  <li>Ограничение применяется к фактическому составу, участвующему в матче.</li>
</ul>
<h3><strong>1.3 Замены</strong></h3>
<ul>
  <li>Разрешены 2 замены.</li>
  <li>Запасные игроки не могут нарушать лимит MMR при выходе в игру.</li>
  <li>На момент проведения матча в команде может единовеременно заменяться только 2 игрока.</li>
</ul>
<h3><strong>1.4 Уточнение</strong></h3>
<ul>
  <li>Разрешено брать на замену игроков выбывших из турнира.</li>
  <li>Запрещено участия игрока, который не был зарегестрирован ни в одной из команд ранее, а также в свободных игроках.</li>
</ul>
<h3><strong>1.5 Все участники дают согласие на проверку аккаунта (по запросу)</strong></h3>
<p>Организатор оставляет за собой право дисквалифицировать игрока при подозрении в нарушении правил.</p>
<h2><strong>2. РЕГИСТРАЦИЯ И ОБЩИЕ ПРАВИЛА</strong></h2>
<h3><strong>2.1 Подача заявок</strong></h3>
<ul>
  <li>Капитан команды обязан предоставить полный состав до <strong>24.04.2026</strong></li>
  <li>Капитан обязан предоставить название и логотип команды.</li>
  <li>Заявки, поданные после указанного срока не рассматриваются ни при каких условиях.</li>
</ul>
<h3><strong>2.2 Общие требования к участникам</strong></h3>
<p>Каждый игрок обязан иметь:</p>
<ul>
  <li>Открытый профиль Dotabuff.</li>
  <li>Общедоступную историю матчей.</li>
  <li>Не обманывать при указе настооящего ммр. Может последовать бан.</li>
</ul>
<p>Организаторы вправе дополнительно запросить демонстрацию входа в аккаунт Steam.</p>
<h3><strong>2.3 Публичность составов</strong></h3>
<p>Все зарегистрированные составы публикуются в открытом доступе.</p>
<h3><strong>2.4 Свободные игроки</strong></h3>
<p>Свободные игроки могут оставить заявку здесь</p>
<h2><strong>3. ИГРОВЫЕ ПРАВИЛА И ПРОВЕДЕНИЕ МАТЧЕЙ</strong></h2>
<h3><strong>3.1 Расписание матчей</strong></h3>
<ul>
  <li>Все матчи проводятся строго по расписанию.</li>
  <li>Команды обязаны быть готовы к началу игры в назначенное время.</li>
</ul>
<h3><strong>3.2 Явка команд</strong></h3>
<ul>
  <li>Все игроки команды должны находиться в голосовом канале не позднее чем за 10 минут до начала матча.</li>
</ul>
<h3><strong>3.3 Задержки</strong></h3>
<p>В случае неготовности команды:</p>
<ul>
  <li>Предоставляется 15 минут на устранение проблемы.</li>
</ul>
<p>По истечении времени - фиксируется техническое поражение.</p>
<h3><strong>3.4 Паузы</strong></h3>
<p>Каждой команде предоставляются паузы:</p>
<ul>
  <li>Общее время на паузы 15 минут.</li>
</ul>
<p>По истечении 15 минут соперник имеет право снять паузу без согласования.</p>
<h3><strong>3.5 Завершение игры (GG)</strong></h3>
<p>Сообщение “GG” в игровом чате:</p>
<ul>
  <li>Не учитывавется, если использовано с колеса чата.</li>
</ul>
<p><strong>Если написано руками:</strong></p>
<ul>
  <li>Автоматически считается признанием поражения.</li>
  <li>Не может быть отменено или оспорено.</li>
</ul>
<h3><strong>3.6 Проведение матчей</strong></h3>
<p>Матчи будут проводиться параллельно.<br>Командам запрещается:</p>
<ul>
  <li>Самостоятельно договариваться о переносе времени.</li>
  <li>Проводить матч без согласования с представителем организаторов.</li>
</ul>
<h3><strong>3.7 Софт</strong></h3>
<p>Если вы намерены использовать сторонние программы для получения преимуществ в игре, то вы будете забанены навсегда на всех турнирах сервера.<br>Если в матче будет замечено использование софта, то команда игрока, использовавшего софт, будет дисквалифицирована на месте без дальнейшего обжалования.</p>
<h2><strong>4. ОРГАНИЗАЦИЯ ТУРНИРА</strong></h2>
<h3><strong>4.1 Коммуникация</strong></h3>
<ul>
  <li>Каждая группа закрепляется за отдельным организатором.</li>
  <li>Вопросы по матчам направляются исключительно закрпленному за вашей командой организатору.</li>
</ul>
<h3><strong>4.2 Контроль со стороны организаторов</strong></h3>
<p>Организаторы имеют право подключаться к голосовым каналам команд, запрашивать необходимую информацию в любое время.</p>
<h3><strong>4.3 Подозрение в мошенничестве</strong></h3>
<p>Капитан команды после матча имеет право запросить проверку игры на софт. (<strong>см. 3.7</strong>)<br>Принимайте поражение с гордостью и не обвиняйте каждого в софте.</p>
<h3><strong>4.4 Формат проведения турнира</strong></h3>
<p>Формат и расписание будет опубликованы за 2 дня до начала турнира.</p>
<p><strong>ВСЕ СПОРНЫЕ СИТУАЦИИ РЕШАЮТСЯ ОРГАНИЗАТОРАМИ В КОНОЧАТЕЛЬНОЙ ФОРМЕ И НЕ ПОДЛЕЖАТ ОСПАРИВАНИЮ.</strong></p>
<p>&lt;@520287458496217098&gt;</p>
`.trim();

const defaultSettings: SiteSettings = {
  discordLink: 'https://discord.gg/npcalert',
  googleFormLink: 'https://docs.google.com/forms/d/1M-m6MBHP49yfmJiNrY-egpyf-K6w34qoetGS6nwCirE/edit#responses',
  freePlayerFormLink: '',
  tournamentName: 'NPC CHAMPIONSHIP',
  tournamentDates: '28.03.2026 – 29.03.2026',
  rulesMode: 'page',
  rulesLink: '',
  rulesContent: defaultRulesContent,
  rulesBannerImage: '/rules-banner.png',
  contactAdmin1: '4 callings bird (@fakalin)',
  contactAdmin2: 'daphne (@dmcmlll)',
  heroSubtitle: 'Турнир по Dota 2 для команд с суммарным MMR до 30 000',
  organizersIntro: 'Команда, которая стоит за NPC CHAMPIONSHIP',
  aboutText: 'NPC CHAMPIONSHIP — турнир по Dota 2 для команд с ограничением по рейтингу. Мы создали этот турнир, чтобы дать возможность игрокам среднего уровня почувствовать атмосферу настоящего киберспортивного состязания.',
  aboutText2: 'Суммарный рейтинг 5 основных игроков не должен превышать 30 000 MMR. Запасные игроки допускаются и не входят в лимит.',
  registrationDeadlineText: 'Приём заявок открыт до 28.03.2026 00:00',
  registrationHowToText: 'Каждая команда подаёт заявку через Google форму. Убедитесь, что все данные заполнены корректно.',
  registrationRules: [
    'Суммарный рейтинг команды (5 игроков) не более 30 000 MMR',
    'У каждого игрока должен быть открытый DotaBuff',
    'Команда должна состоять минимум из 5 основных игроков',
    'Запасные игроки допускаются и не учитываются в лимите MMR',
    'Капитан команды несёт ответственность за все действия состава',
  ],
  tournamentCompleted: false,
  schedulePreparingText: 'Расписание готовится. Следите за обновлениями.',
  scheduleCompletedText: 'Турнир завершён. Спасибо всем участникам и зрителям!',
  mvpText: 'По итогам турнира будет выбран самый ценный игрок (MVP). MVP определяется общим голосованием зрителей и судей-организаторов.',
  mvpPrize: 'Приз: уникальный скин в Dota 2 и эксклюзивная роль на Discord-сервере',
  musicUrl: '',
  mvpPlayerId: '',
  mvpMusicUrl: '',
  infoCards: [
    { id: '1', label: 'Призы', desc: 'Скины и роли' },
    { id: '2', label: 'Команды', desc: 'Зарегистрировано' },
    { id: '3', label: '2 дня', desc: '28-29 марта' },
    { id: '4', label: 'MVP', desc: 'Голосование зрителей' },
  ],
  formatStages: [
    { id: '1', title: 'Групповой этап', desc: 'Round-robin в группах. Матчи Bo2. Результаты: 2-0 (3 очка), 1-1 (1 очко), 0-2 (0 очков).' },
    { id: '2', title: 'Плей-офф', desc: 'Double Elimination. Верхняя и нижняя сетка. Матчи Bo1.' },
    { id: '3', title: 'Финал', desc: 'Grand Final — Bo3. Команда из верхней сетки имеет преимущество.' },
  ],
  faqItems: [
    { id: '1', q: 'Можно ли сменить игрока?', a: 'Замена игрока возможна до начала турнира с согласия организаторов.' },
    { id: '2', q: 'Что если у игрока закрыт DotaBuff?', a: 'Все игроки обязаны иметь открытый DotaBuff. Закрытый профиль — причина для дисквалификации.' },
    { id: '3', q: 'Что если команда не пришла?', a: 'Неявка на матч = техническое поражение (0-2).' },
    { id: '4', q: 'Можно ли паузить?', a: 'Каждая команда имеет право на 1 паузу до 5 минут за карту.' },
    { id: '5', q: 'Какие форматы матчей?', a: 'Групповой этап — Bo2, плей-офф — Bo1, финал — Bo3.' },
  ],
  staffMembers: [
    { id: '1', name: '4 поющих птицы (@fakalin)', role: 'Организатор' },
    { id: '2', name: 'дафна (@dmcmlll)', role: 'Организатор' },
  ],
  freePlayers: [],
  contactsList: ['4 callings bird (@fakalin)', 'daphne (@dmcmlll)'],
  footerCopyright: '© 2026 NPC CHAMPIONSHIP. Все права защищены.',
  maintenanceEnabled: false,
  maintenanceTitle: 'Технические работы',
  maintenanceMessage: 'Сайт временно недоступен. Пожалуйста, зайдите позже.',
};

const defaultData: TournamentData = {
  teams: [],
  news: [
    { id: '1', title: 'Blank Championship анонсирован!', summary: 'Первый турнир Blank Championship пройдёт 28-29 марта 2026 года. Регистрация открыта!', content: 'Мы рады объявить о проведении первого турнира Blank Championship по Dota 2!', image: '', date: '2026-03-15' },
    { id: '2', title: 'Регистрация команд открыта', summary: 'Подача заявок через Google форму.', content: 'Регистрация команд открыта! Подайте заявку через Google форму до 28.03.2026.', image: '', date: '2026-03-16' },
    { id: '3', title: 'Правила турнира опубликованы', summary: 'Ознакомьтесь с полным регламентом.', content: 'Полный регламент опубликован на сайте.', image: '', date: '2026-03-17' },
  ],
  matches: [],
  bracketConnections: [],
  groups: [],
  settings: defaultSettings,
};

const LS_KEY = 'npc-tournament-data';

function loadFromLS(): TournamentData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultData, ...parsed, settings: { ...defaultSettings, ...(parsed.settings || {}) } };
    return {
      ...merged,
      teams: (merged.teams || []).map(team => ({
        ...team,
        players: (team.players || []).map(player => ({
          ...player,
          isSubstitute: player.isSubstitute ?? player.role === 'reserve',
        })),
      })),
    };
  } catch { return defaultData; }
}

function saveToLS(d: TournamentData) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch { /* quota */ }
}

interface TournamentContextType {
  data: TournamentData;
  isAdmin: boolean;
  isEditing: boolean;
  loading: boolean;
  saving: boolean;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleEditing: () => void;
  updateSettings: (settings: Partial<SiteSettings>) => void;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addNews: (news: NewsItem) => void;
  updateNews: (news: NewsItem) => void;
  deleteNews: (id: string) => void;
  addMatch: (match: TournamentMatch) => void;
  updateMatch: (match: TournamentMatch) => void;
  deleteMatch: (id: string) => void;
  updateBracketConnections: (connections: BracketConnection[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  generateGroupMatches: (groupId: string) => void;
  getTeamById: (id: string) => Team | undefined;
  getGroupStandings: (groupId: string) => { teamId: string; wins: number; losses: number; draws: number; points: number }[];
  refreshData: () => Promise<void>;
  withdrawTeam: (id: string, reason?: string) => void;
  backups: BackupSnapshot[];
  refreshBackups: () => Promise<void>;
  createBackup: (note: string) => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export const useTournament = () => {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
};

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<TournamentData>(loadFromLS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const pendingDataRef = useRef<TournamentData | null>(null);

  // ── Fetch fresh data from Supabase ──────────────────────────────────────
const loadFromSupabase = useCallback(async () => {
  try {
    const parsed = await fetchTournamentData();
    const merged: TournamentData = {
      ...defaultData,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      teams: (parsed.teams || []).map(team => ({
        ...team,
        players: (team.players || []).map(player => ({
          ...player,
          isSubstitute: player.isSubstitute ?? player.role === 'reserve',
        })),
      })),
    };
    setData(merged);
    saveToLS(merged);
  } catch (e) {
    console.warn('Supabase fetch failed, using local data:', e);
  }
}, []);

  useEffect(() => {
    Promise.all([
      loadFromSupabase(),
      (async () => {
        const admin = await isCurrentUserAdmin();
        setIsAdmin(admin);
        if (admin) setBackups(await listBackups());
      })(),
    ]).finally(() => setLoading(false));
  }, [loadFromSupabase]);

  // ── Realtime updates for all clients ────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeTournamentUpdates(() => {
      if (!saving) loadFromSupabase();
    });
    return () => unsub();
  }, [loadFromSupabase, saving]);

  // ── Save to Supabase ────────────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    const dataToSave = pendingDataRef.current ?? data;
    setSaving(true);
    setSaveError(null);
    try {
      await saveTournamentData(dataToSave);
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSaveError(msg);
      console.error('Supabase save error:', msg);
    } finally {
      setSaving(false);
    }
  }, [data]);

  const updateData = useCallback((updater: (prev: TournamentData) => TournamentData) => {
    setData(prev => {
      const next = updater(prev);
      saveToLS(next);
      pendingDataRef.current = next;
      setHasUnsavedChanges(true);
      return next;
    });
  }, []);

  const login = async (email: string, password: string) => {
    await signInAdmin(email, password);
    setIsAdmin(true);
    setBackups(await listBackups());
  };

  const logout = async () => {
    await signOutAdmin();
    setIsAdmin(false);
    setIsEditing(false);
    setBackups([]);
  };
  const toggleEditing = () => setIsEditing(prev => !prev);
  const updateSettings = (s: Partial<SiteSettings>) =>
    updateData(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));

  const addTeam = (team: Team) => updateData(prev => ({ ...prev, teams: [...prev.teams, team] }));
  const updateTeam = (team: Team) => updateData(prev => ({ ...prev, teams: prev.teams.map(t => t.id === team.id ? team : t) }));
  const deleteTeam = (id: string) => updateData(prev => ({ ...prev, teams: prev.teams.filter(t => t.id !== id) }));

  const addNews = (news: NewsItem) => updateData(prev => ({ ...prev, news: [news, ...prev.news] }));
  const updateNews = (news: NewsItem) => updateData(prev => ({ ...prev, news: prev.news.map(n => n.id === news.id ? news : n) }));
  const deleteNews = (id: string) => updateData(prev => ({ ...prev, news: prev.news.filter(n => n.id !== id) }));

  const addMatch = (match: TournamentMatch) => updateData(prev => ({ ...prev, matches: [...prev.matches, match] }));
  const updateMatch = (match: TournamentMatch) => updateData(prev => ({ ...prev, matches: prev.matches.map(m => m.id === match.id ? match : m) }));
  const deleteMatch = (id: string) =>
    updateData(prev => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== id),
      bracketConnections: (prev.bracketConnections || []).filter(
        c => c.fromMatchId !== id && c.toMatchId !== id
      ),
    }));
  const updateBracketConnections = (connections: BracketConnection[]) =>
    updateData(prev => ({ ...prev, bracketConnections: connections }));

  const addGroup = (group: Group) => updateData(prev => ({ ...prev, groups: [...prev.groups, group] }));
  const updateGroup = (group: Group) => updateData(prev => ({ ...prev, groups: prev.groups.map(g => g.id === group.id ? group : g) }));
  const deleteGroup = (id: string) =>
    updateData(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== id),
      matches: prev.matches.filter(m => m.groupId !== id),
    }));

  const generateGroupMatches = (groupId: string) => {
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return;
    const existingNonGroup = data.matches.filter(m => m.groupId !== groupId);
    const newMatches: TournamentMatch[] = [];
    const teams = group.teamIds;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        newMatches.push({
          id: `group-${groupId}-${teams[i]}-${teams[j]}`,
          team1Id: teams[i], team2Id: teams[j],
          stage: 'group', format: 'Bo2', groupId,
          scheduledDate: '', scheduledTime: '',
          status: 'scheduled', round: 1,
        });
      }
    }
    updateData(prev => ({ ...prev, matches: [...existingNonGroup, ...newMatches] }));
  };

  const getTeamById = useCallback((id: string) => data.teams.find(t => t.id === id), [data.teams]);

  const calcPoints = (wins: number, draws: number, losses: number, formula?: string): number => {
    if (!formula || !formula.trim()) return wins * 3 + draws;
    try {
      // Safe formula evaluation: only allow W, D, L, digits, *, +, -, (, ), spaces
      const clean = formula.replace(/[^WDLwdl0-9+\-*\/() ]/g, '');
      const expr = clean
        .replace(/W/gi, String(wins))
        .replace(/D/gi, String(draws))
        .replace(/L/gi, String(losses));
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr + ')')();
      return typeof result === 'number' && isFinite(result) ? result : 0;
    } catch { return wins * 3 + draws; }
  };

  const getGroupStandings = useCallback((groupId: string) => {
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return [];
    const matches = data.matches.filter(m =>
      m.groupId === groupId && m.status === 'completed' && m.result);
    const standings = group.teamIds.map(teamId => {
      let wins = 0, losses = 0, draws = 0;
      matches.forEach(m => {
        if (!m.result) return;
        if (m.team1Id === teamId) {
          if (m.result.team1Score > m.result.team2Score) wins++;
          else if (m.result.team1Score < m.result.team2Score) losses++;
          else draws++;
        } else if (m.team2Id === teamId) {
          if (m.result.team2Score > m.result.team1Score) wins++;
          else if (m.result.team2Score < m.result.team1Score) losses++;
          else draws++;
        }
      });
      const points = calcPoints(wins, draws, losses, group.pointsFormula);
      return { teamId, wins, losses, draws, points };
    });
    return standings.sort((a, b) => b.points - a.points);
  }, [data.groups, data.matches]);

  const withdrawTeam = (id: string, reason?: string) =>
    updateData(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id === id ? { ...t, status: 'withdrawn' as const, withdrawalReason: reason ?? '' } : t
      ),
    }));

  const refreshBackups = useCallback(async () => {
    if (!isAdmin) return;
    setBackups(await listBackups());
  }, [isAdmin]);

  const createBackup = useCallback(async (note: string) => {
    const snapshot = pendingDataRef.current ?? data;
    await createBackupSnapshot(snapshot, note);
    await refreshBackups();
  }, [data, refreshBackups]);

  const restoreBackup = useCallback(async (backupId: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      await restoreBackupSnapshot(backupId);
      await loadFromSupabase();
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSaveError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [loadFromSupabase]);

  const deleteBackup = useCallback(async (backupId: string) => {
    await deleteBackupSnapshot(backupId);
    await refreshBackups();
  }, [refreshBackups]);

  return (
    <TournamentContext.Provider value={{
      data, isAdmin, isEditing, loading, saving, saveError,
      hasUnsavedChanges, saveNow,
      login, logout, toggleEditing, updateSettings,
      addTeam, updateTeam, deleteTeam,
      addNews, updateNews, deleteNews,
      addMatch, updateMatch, deleteMatch,
      updateBracketConnections,
      addGroup, updateGroup, deleteGroup,
      generateGroupMatches, getTeamById, getGroupStandings, withdrawTeam,
      refreshData: loadFromSupabase,
      backups, refreshBackups, createBackup, restoreBackup, deleteBackup,
    }}>
      {children}
    </TournamentContext.Provider>
  );
};
