export type QType = "clause" | "fixerror" | "fillblank" | "output";
export type Loc = { fr: string; en: string };
const u = (s: string): Loc => ({ fr: s, en: s }); // texte universel (SQL)

export type Challenge = {
  id: string;
  level: 1 | 2 | 3;
  type: QType;
  prompt: Loc;
  code?: string;          // SQL affiché (universel)
  options: Loc[];
  answer: number;         // index de la bonne option
  explain: Loc;
  match?: string[];       // jetons pour la saisie libre (MAJ, tous requis)
};

export const CHALLENGES: Challenge[] = [
  /* ---------------- NIVEAU 1 : les bases ---------------- */
  {
    id: "l1-dup", level: 1, type: "clause",
    prompt: { fr: "Des lignes identiques se reproduisent : le même client, cinq fois.", en: "Identical rows keep breeding: the same customer, five times." },
    options: [u("SELECT DISTINCT …"), u("WHERE … IS NOT NULL"), u("LIMIT 1000"), u("ORDER BY name")],
    answer: 0, match: ["DISTINCT"],
    explain: { fr: "DISTINCT élimine les lignes en double.", en: "DISTINCT removes duplicate rows." },
  },
  {
    id: "l1-null", level: 1, type: "clause",
    prompt: { fr: "La moitié de la colonne email est NULL. Ne garde que les lignes remplies.", en: "Half the email column is NULL. Keep only the filled rows." },
    options: [u("WHERE email IS NOT NULL"), u("TRIM(email)"), u("COUNT(email)"), u("LOWER(email)")],
    answer: 0, match: ["IS NOT NULL"],
    explain: { fr: "IS NOT NULL filtre les valeurs vides (on ne teste jamais NULL avec =).", en: "IS NOT NULL filters empty values (never test NULL with =)." },
  },
  {
    id: "l1-trim", level: 1, type: "clause",
    prompt: { fr: "'  Paris  ' ne matche pas 'Paris' : des espaces sournois partout.", en: "'  Paris  ' won't match 'Paris': sneaky spaces everywhere." },
    options: [u("TRIM(city)"), u("CAST(city AS TEXT)"), u("UPPER(city)"), u("LEFT(city, 5)")],
    answer: 0, match: ["TRIM"],
    explain: { fr: "TRIM enlève les espaces en début et fin de chaîne.", en: "TRIM strips leading and trailing spaces." },
  },
  {
    id: "l1-lower", level: 1, type: "clause",
    prompt: { fr: "'Paris', 'PARIS', 'paris' — une ville, trois déguisements. Uniformise la casse.", en: "'Paris', 'PARIS', 'paris' — one city, three disguises. Normalize case." },
    options: [u("LOWER(city)"), u("TRIM(city)"), u("DISTINCT city"), u("ROUND(city)")],
    answer: 0, match: ["LOWER"],
    explain: { fr: "LOWER met tout en minuscules pour comparer sans se soucier de la casse.", en: "LOWER lowercases everything so comparisons ignore case." },
  },
  {
    id: "l1-limit", level: 1, type: "clause",
    prompt: { fr: "La requête veut renvoyer 40 millions de lignes. Le serveur supplie. Plafonne.", en: "The query wants 40 million rows. The server begs. Cap it." },
    options: [u("LIMIT 1000"), u("COUNT(*)"), u("OFFSET 40"), u("MAX(rows)")],
    answer: 0, match: ["LIMIT"],
    explain: { fr: "LIMIT borne le nombre de lignes retournées.", en: "LIMIT caps the number of returned rows." },
  },
  {
    id: "l1-fill-distinct", level: 1, type: "fillblank",
    prompt: { fr: "But : lister chaque pays une seule fois. Complète le trou.", en: "Goal: list each country once. Fill the blank." },
    code: "SELECT ______ country\nFROM customers;",
    options: [u("DISTINCT"), u("UNIQUE"), u("ONLY"), u("SINGLE")],
    answer: 0, match: ["DISTINCT"],
    explain: { fr: "SELECT DISTINCT est le bon couple. UNIQUE existe, mais c'est une contrainte de table, pas un mot du SELECT.", en: "SELECT DISTINCT is correct. UNIQUE exists, but as a table constraint, not a SELECT keyword." },
  },
  {
    id: "l1-out-count", level: 1, type: "output",
    prompt: { fr: "La table orders a 12 lignes, dont 2 avec amount à NULL. Que renvoie-t-elle ?", en: "Table orders has 12 rows, 2 with amount = NULL. What does it return?" },
    code: "SELECT COUNT(*) FROM orders;",
    options: [u("12"), u("10"), u("2"), { fr: "NULL", en: "NULL" }],
    answer: 0,
    explain: { fr: "COUNT(*) compte toutes les lignes, NULL compris. COUNT(amount) aurait donné 10.", en: "COUNT(*) counts every row, NULLs included. COUNT(amount) would give 10." },
  },

  /* ---------------- NIVEAU 2 : intermédiaire ---------------- */
  {
    id: "l2-group", level: 2, type: "clause",
    prompt: { fr: "Il te faut une ligne par client, mais tu en as une par commande.", en: "You need one line per customer, but you've got one per order." },
    options: [u("GROUP BY customer_id"), u("DISTINCT *"), u("JOIN orders"), u("LIMIT 1")],
    answer: 0, match: ["GROUP BY"],
    explain: { fr: "GROUP BY regroupe les lignes par client pour les agréger.", en: "GROUP BY collapses rows per customer so you can aggregate." },
  },
  {
    id: "l2-cast", level: 2, type: "clause",
    prompt: { fr: "Les dates sont stockées en texte : '2003-05-01'. Compare-les comme des dates.", en: "Dates are stored as text: '2003-05-01'. Compare them as real dates." },
    options: [u("CAST(d AS DATE)"), u("TRIM(d)"), u("TO_TEXT(d)"), u("LOWER(d)")],
    answer: 0, match: ["CAST"],
    explain: { fr: "CAST(… AS DATE) convertit le texte en vraie date.", en: "CAST(… AS DATE) converts text into an actual date." },
  },
  {
    id: "l2-join", level: 2, type: "clause",
    prompt: { fr: "Les commandes ont un customer_id, mais il te faut aussi les noms des clients.", en: "Orders carry a customer_id, but you also need the customer names." },
    options: [u("JOIN customers ON …"), u("UNION customers"), u("WHERE customers"), u("GROUP BY customers")],
    answer: 0, match: ["JOIN"],
    explain: { fr: "JOIN relie les deux tables sur leur clé commune.", en: "JOIN links both tables on their shared key." },
  },
  {
    id: "l2-having", level: 2, type: "clause",
    prompt: { fr: "Ne garder que les clients avec plus de 5 commandes — APRÈS le regroupement.", en: "Keep only customers with more than 5 orders — AFTER grouping." },
    options: [u("HAVING COUNT(*) > 5"), u("WHERE COUNT(*) > 5"), u("LIMIT 5"), u("FILTER > 5")],
    answer: 0, match: ["HAVING"],
    explain: { fr: "On filtre un agrégat avec HAVING. WHERE agit avant le GROUP BY et ne connaît pas COUNT(*).", en: "Filter an aggregate with HAVING. WHERE runs before GROUP BY and can't see COUNT(*)." },
  },
  {
    id: "l2-like", level: 2, type: "clause",
    prompt: { fr: "Trouver tous les emails finissant par '@gmail.com'.", en: "Find every email ending in '@gmail.com'." },
    options: [u("WHERE email LIKE '%@gmail.com'"), u("WHERE email = '@gmail.com'"), u("CONTAINS(email)"), u("MATCH email")],
    answer: 0, match: ["LIKE"],
    explain: { fr: "LIKE avec le joker % capture un motif partiel.", en: "LIKE with the % wildcard matches a partial pattern." },
  },
  {
    id: "l2-coalesce", level: 2, type: "clause",
    prompt: { fr: "Afficher le téléphone, mais 'N/A' quand il est NULL.", en: "Show the phone, but 'N/A' when it's NULL." },
    options: [u("COALESCE(phone, 'N/A')"), u("TRIM(phone)"), u("CAST(phone)"), u("DISTINCT phone")],
    answer: 0, match: ["COALESCE"],
    explain: { fr: "COALESCE renvoie la première valeur non-NULL de la liste.", en: "COALESCE returns the first non-NULL value in the list." },
  },
  {
    id: "l2-fix-eqnull", level: 2, type: "fixerror",
    prompt: { fr: "Cette requête renvoie zéro ligne alors qu'il y a des comptes supprimés. Le correctif ?", en: "This returns zero rows even though deleted accounts exist. The fix?" },
    code: "SELECT * FROM users\nWHERE deleted_at = NULL;",
    options: [u("IS NULL au lieu de = NULL / instead of = NULL"), u("DISTINCT"), u("COUNT(*)"), u("== NULL")],
    answer: 0,
    explain: { fr: "NULL n'est jamais égal à quoi que ce soit, même à NULL. On teste avec IS NULL.", en: "NULL is never equal to anything, not even NULL. Test with IS NULL." },
  },
  {
    id: "l2-fix-groupby", level: 2, type: "fixerror",
    prompt: { fr: "Cette requête plante. Qu'est-ce qui manque ?", en: "This query errors. What's missing?" },
    code: "SELECT country, COUNT(*)\nFROM customers;",
    options: [u("GROUP BY country"), u("ORDER BY country"), u("WHERE country"), u("DISTINCT country")],
    answer: 0,
    explain: { fr: "Sélectionner une colonne à côté d'un agrégat impose un GROUP BY sur cette colonne.", en: "Selecting a column next to an aggregate requires GROUP BY on that column." },
  },
  {
    id: "l2-fill-on", level: 2, type: "fillblank",
    prompt: { fr: "Complète la jointure.", en: "Complete the join." },
    code: "SELECT *\nFROM orders o\nJOIN customers c ____ o.cust_id = c.id;",
    options: [u("ON"), u("WHERE"), u("AND"), u("AS")],
    answer: 0, match: ["ON"],
    explain: { fr: "La condition d'une jointure explicite s'écrit après ON.", en: "An explicit join's condition goes after ON." },
  },
  {
    id: "l2-out-groups", level: 2, type: "output",
    prompt: { fr: "Statuts présents : paid, paid, paid, pending, failed. Combien de lignes en sortie ?", en: "Statuses present: paid, paid, paid, pending, failed. How many rows come out?" },
    code: "SELECT status, COUNT(*)\nFROM orders\nGROUP BY status;",
    options: [u("3"), u("5"), u("1"), u("0")],
    answer: 0,
    explain: { fr: "Une ligne par groupe distinct : paid, pending, failed → 3.", en: "One row per distinct group: paid, pending, failed → 3." },
  },

  /* ---------------- NIVEAU 3 : le boss, vrai défi ---------------- */
  {
    id: "l3-window-rn", level: 3, type: "clause",
    prompt: { fr: "Numéroter les commandes de chaque client, la plus récente d'abord, SANS écraser les lignes.", en: "Number each customer's orders, newest first, WITHOUT collapsing rows." },
    options: [
      u("ROW_NUMBER() OVER (PARTITION BY cust_id ORDER BY date DESC)"),
      u("GROUP BY cust_id"), u("COUNT(*)"), u("DISTINCT ON (cust_id)"),
    ],
    answer: 0, match: ["OVER", "PARTITION"],
    explain: { fr: "Une fonction fenêtre (OVER … PARTITION BY) numérote sans regrouper : les lignes restent.", en: "A window function (OVER … PARTITION BY) numbers without grouping: rows stay intact." },
  },
  {
    id: "l3-dedupe-recent", level: 3, type: "clause",
    prompt: { fr: "Ne garder que la ligne la plus récente par client (dédoublonnage par récence).", en: "Keep only the latest row per customer (dedupe by recency)." },
    options: [
      u("ROW_NUMBER() OVER (PARTITION BY id ORDER BY ts DESC) = 1"),
      u("DISTINCT id"), u("MAX(ts)"), u("GROUP BY id"),
    ],
    answer: 0, match: ["OVER"],
    explain: { fr: "On numérote par client trié par date, puis on garde le rang 1. MAX(ts) seul perdrait les autres colonnes.", en: "Number per customer by date, then keep rank 1. MAX(ts) alone would drop the other columns." },
  },
  {
    id: "l3-fix-havingwhere", level: 3, type: "fixerror",
    prompt: { fr: "Cette requête plante sur le WHERE. Corrige-la.", en: "This query errors on the WHERE. Fix it." },
    code: "SELECT dept, AVG(salary)\nFROM emp\nWHERE AVG(salary) > 5000\nGROUP BY dept;",
    options: [u("WHERE → HAVING (après GROUP BY)"), u("Enlever GROUP BY / Remove GROUP BY"), u("Ajouter DISTINCT / Add DISTINCT"), u("ORDER BY salary")],
    answer: 0,
    explain: { fr: "Un agrégat ne se filtre pas dans WHERE. On le met dans HAVING, après le regroupement.", en: "You can't filter an aggregate in WHERE. Put it in HAVING, after grouping." },
  },
  {
    id: "l3-fix-countdistinct", level: 3, type: "fixerror",
    prompt: { fr: "Tu veux le nombre de clients UNIQUES. Corrige.", en: "You want the number of UNIQUE customers. Fix it." },
    code: "SELECT COUNT(customer_id)\nFROM orders;",
    options: [u("COUNT(DISTINCT customer_id)"), u("COUNT(*)"), u("SUM(customer_id)"), u("DISTINCT COUNT()")],
    answer: 0,
    explain: { fr: "COUNT(col) compte les valeurs non-NULL, doublons inclus. Il faut COUNT(DISTINCT …).", en: "COUNT(col) counts non-NULL values, duplicates included. You need COUNT(DISTINCT …)." },
  },
  {
    id: "l3-out-leftjoin", level: 3, type: "output",
    prompt: { fr: "a a 3 lignes, b n'a AUCUNE ligne correspondante. Résultat ?", en: "a has 3 rows, b has NO matching rows. Result?" },
    code: "SELECT COUNT(*)\nFROM a\nLEFT JOIN b ON a.id = b.aid;",
    options: [u("3"), u("0"), { fr: "NULL", en: "NULL" }, { fr: "erreur", en: "error" }],
    answer: 0,
    explain: { fr: "Un LEFT JOIN garde toutes les lignes de gauche ; les non-appariées reçoivent des NULL, mais comptent.", en: "A LEFT JOIN keeps every left row; unmatched ones get NULLs but still count." },
  },
  {
    id: "l3-out-innerdup", level: 3, type: "output",
    prompt: { fr: "a.id = 1 (une fois). b a 3 lignes avec aid = 1. Résultat ?", en: "a.id = 1 (once). b has 3 rows with aid = 1. Result?" },
    code: "SELECT COUNT(*)\nFROM a\nJOIN b ON a.id = b.aid;",
    options: [u("3"), u("1"), u("4"), u("0")],
    answer: 0,
    explain: { fr: "Une jointure multiplie les correspondances : 1 × 3 = 3 lignes. Le piège classique de la fan-out.", en: "A join multiplies matches: 1 × 3 = 3 rows. The classic fan-out trap." },
  },
  {
    id: "l3-fill-over", level: 3, type: "fillblank",
    prompt: { fr: "Complète la fonction fenêtre.", en: "Complete the window function." },
    code: "SELECT name,\n  RANK() ______ (ORDER BY score DESC)\nFROM players;",
    options: [u("OVER"), u("GROUP BY"), u("PARTITION"), u("WITHIN")],
    answer: 0, match: ["OVER"],
    explain: { fr: "OVER (…) définit la fenêtre sur laquelle RANK() s'applique.", en: "OVER (…) defines the window RANK() operates on." },
  },
];

/* Chaque ennemi ne tire que dans ses niveaux → la difficulté se voit dans les questions */
export type Enemy = { id: string; color: string; hp: number; power: number; boss?: boolean; levels: number[] };

export const ENEMIES: Enemy[] = [
  { id: "dupe",   color: "#4aa8ff", hp: 90,  power: 14, levels: [1] },
  { id: "nullz",  color: "#4bd66c", hp: 110, power: 16, levels: [1, 2] },
  { id: "space",  color: "#ffcd75", hp: 120, power: 18, levels: [2] },
  { id: "flood",  color: "#b478ff", hp: 140, power: 20, levels: [2, 3] },
  { id: "legacy", color: "#f24e6b", hp: 200, power: 24, boss: true, levels: [3] },
];
