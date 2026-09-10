/**
 * GB/T 7714-2025 文献类型枚举
 * 对齐规范附录 A.1
 */
export enum ReferenceType {
  /** 图书（旧称"专著"） */
  M = 'M',
  /** 期刊 */
  J = 'J',
  /** 报纸 */
  N = 'N',
  /** 会议录 */
  C = 'C',
  /** 学位论文 */
  D = 'D',
  /** 报告 */
  R = 'R',
  /** 标准 */
  S = 'S',
  /** 专利 */
  P = 'P',
  /** 网站、网页（旧称"电子公告"） */
  EB = 'EB',
  /** 档案（2025新增） */
  A = 'A',
  /** 地图（旧称"舆图"） */
  CM = 'CM',
  /** 数据集（2025新增） */
  DS = 'DS',
  /** 预印本（2025新增） */
  PP = 'PP',
  /** 汇编 */
  G = 'G',
  /** 计算机程序 */
  CP = 'CP',
  /** 数据库 */
  DB = 'DB',
  /** 其他 */
  Z = 'Z',
}

/**
 * 电子资源载体标识枚举
 * 对齐规范附录 A.2
 */
export enum MediaType {
  /** 磁带（magnetic tape） */
  MT = 'MT',
  /** 磁盘（disk） */
  DK = 'DK',
  /** 光盘（CD-ROM） */
  CD = 'CD',
  /** 联机网络（online） */
  OL = 'OL',
  /** 缩微资料（microform materials，2025新增） */
  MM = 'MM',
}

/**
 * 作者模型
 */
export interface Author {
  /** 作者姓名（原样保留） */
  name: string;
  /** 是否为机构作者 */
  isOrganization?: boolean;
}

/**
 * 标引体系
 */
export type CitationStyle = 'numeric' | 'author-date' | 'footnote';

/**
 * 标准版本
 */
export type StandardVersion = '2015' | '2025';

/**
 * 核心文献接口
 */
export interface Reference {
  /** 序号（顺序编码制） */
  id?: string;
  /** 文献类型 */
  type: ReferenceType;
  /** 电子资源载体标识（电子资源必备） */
  mediaType?: MediaType;
  /** 作者列表 */
  authors: Author[];
  /** 是否截断了作者列表（原文有超过 3 个作者，显示 "等"） */
  authorsTruncated?: boolean;
  /** 题名 */
  title: string;
  /** 其他题名信息（副题名、分卷书名等） */
  subtitle?: string;
  /** 其他责任者（译者、编者等） */
  otherAuthors?: Author[];
  /** 版本 */
  version?: string;
  /** 出版地 */
  publisherPlace?: string;
  /** 出版者 */
  publisher?: string;
  /** 出版年 */
  year?: string;
  /** 其他纪年形式（如"民国三十六年"），应置于"（ ）"内 */
  alternativeYear?: string;
  /** 页码 */
  pages?: string;
  /** 获取和访问路径 */
  url?: string;
  /** 永久标识符（DOI、URN等） */
  pid?: string;
  /** 引用日期（YYYY-MM-DD） */
  accessDate?: string;
}

/**
 * 出处文献接口（用于析出文献）
 */
export interface HostReference {
  /** 出处文献作者 */
  authors?: Author[];
  /** 是否截断了作者列表（原文有超过 3 个作者，显示 "等"） */
  authorsTruncated?: boolean;
  /** 出处文献题名 */
  title: string;
  /** 出处文献其他题名信息 */
  subtitle?: string;
  /** 版本 */
  version?: string;
  /** 出版地 */
  publisherPlace?: string;
  /** 出版者 */
  publisher?: string;
  /** 出版年 */
  year?: string;
}

/**
 * 析出文献接口
 */
export interface ComponentPart extends Reference {
  /** 出处文献信息 */
  host: HostReference;
}

/**
 * 期刊接口
 */
export interface Journal extends Reference {
  type: ReferenceType.J;
  /** 刊名 */
  journalTitle: string;
  /** 刊名其他题名信息 */
  journalSubtitle?: string;
  /** 年 */
  year: string;
  /** 卷 */
  volume?: string;
  /** 期（含合期号，如 "8/9/10"） */
  issue?: string;
  /** 在线出版日期（YYYY-MM-DD） */
  onlineDate?: string;
  /** 文章编号（无页码时使用） */
  articleNumber?: string;
  /** 增刊标识（如 "增刊 2"、"S1"） */
  supplement?: string;
}

/**
 * 报纸接口
 */
export interface Newspaper extends Reference {
  type: ReferenceType.N;
  /** 报纸名 */
  newspaperTitle: string;
  /** 出版日期（YYYY-MM-DD） */
  year: string;
  /** 月日（如 "09-07"） */
  monthDay?: string;
  /** 版次（如 "15"） */
  edition?: string;
}

/**
 * 连续出版物接口（§8.4）
 */
export interface Serial extends Reference {
  type: ReferenceType.J;
  /** 刊名 */
  serialTitle: string;
  /** 刊名其他题名信息 */
  serialSubtitle?: string;
  /** 起始年 */
  startYear: string;
  /** 起始卷 */
  startVolume?: string;
  /** 起始期 */
  startIssue?: string;
  /** 结束年（无限期发行时为空） */
  endYear?: string;
  /** 结束卷 */
  endVolume?: string;
  /** 结束期 */
  endIssue?: string;
  /** 出版地 */
  publisherPlace?: string;
  /** 出版者 */
  publisher?: string;
  /** 出版年起始 */
  publicationStartYear?: string;
  /** 出版年结束（无限期发行时为空） */
  publicationEndYear?: string;
  /**
   * 连载后续部分（§8.5.1.3）
   * 凡是在同一期刊上连载的文献，其后续部分不必另行著录
   * 格式: "年, 卷(期): 页码" 或 "年, 卷(期): 起始页码-终止页码"
   */
  continuationParts?: string[];
}

/**
 * 图书接口
 */
export interface Book extends Reference {
  type: ReferenceType.M;
  /** ISBN */
  isbn?: string;
  /** 印刷版次（如 "刻本"、"影印本"） */
  reprint?: string;
}

/**
 * 学位论文接口
 */
export interface Thesis extends Reference {
  type: ReferenceType.D;
  /** 学位授予单位所在地 */
  awardPlace?: string;
  /** 学位授予单位（必备） */
  awardInstitution: string;
  /** 学位授予年 */
  awardYear?: string;
  /** 导师 */
  supervisor?: string;
}

/**
 * 会议录接口
 */
export interface Proceedings extends Reference {
  type: ReferenceType.C;
  /** 会议名称 */
  conferenceName?: string;
  /** 会议年份 */
  conferenceYear?: string;
}

/**
 * 报告接口
 */
export interface Report extends Reference {
  type: ReferenceType.R;
  /** 报告编号 */
  reportNumber?: string;
  /** 发布日期（YYYY-MM-DD） */
  releaseDate?: string;
  /** 副题名（题名含双冒号时，第二个冒号后的内容） */
  subtitle?: string;
}

/**
 * 标准接口
 */
export interface Standard extends Reference {
  type: ReferenceType.S;
  /** 标准编号（必备，如 "GB/T 3792—2021"） */
  standardNumber: string;
  /** 标准名称（必备） */
  standardName: string;
  /** 是否包含类型标识，默认 true */
  includeTypeIndicator?: boolean;
}

/**
 * 专利接口
 */
export interface Patent extends Reference {
  type: ReferenceType.P;
  /** 专利申请号（必备） */
  patentNumber: string;
  /** 公告(公开)日期（YYYY-MM-DD） */
  announceDate?: string;
}

/**
 * 网站、网页接口
 */
export interface WebPage extends Reference {
  type: ReferenceType.EB;
  /** 创建或修改日期（YYYY-MM-DD） */
  createDate?: string;
  /** 引用日期（必备，[YYYY-MM-DD]） */
  accessDate: string;
}

/**
 * 档案接口
 */
export interface Archive extends Reference {
  type: ReferenceType.A;
  /** 档号 */
  archiveNumber?: string;
  /** 收藏者所在地 */
  collectionPlace?: string;
  /** 收藏者 */
  collector?: string;
  /** 形成日期 */
  formedDate?: string;
}

/**
 * 地图接口
 */
export interface Map extends Reference {
  type: ReferenceType.CM;
  /** 比例尺（如 "1 : 25 000"） */
  scale?: string;
  /** 尺寸（纸质单幅地图必备，如 "128 cm × 84 cm"） */
  dimensions?: string;
}

/**
 * 数据集接口
 */
export interface Dataset extends Reference {
  type: ReferenceType.DS;
  /** 发布平台 */
  platform?: string;
  /** 发布或修改日期（YYYY-MM-DD） */
  releaseDate?: string;
  /** 引用日期（必备，[YYYY-MM-DD]） */
  accessDate: string;
}

/**
 * 预印本接口
 */
export interface Preprint extends Reference {
  type: ReferenceType.PP;
  /** 出版平台（如 arXiv、ChinaXiv） */
  platform?: string;
  /** 创建或修改日期（YYYY-MM-DD） */
  createDate?: string;
  /** 引用日期（必备，[YYYY-MM-DD]） */
  accessDate: string;
}

/**
 * 汇编接口
 */
export interface Compilation extends Reference {
  type: ReferenceType.G;
}

/**
 * 计算机程序接口
 */
export interface ComputerProgram extends Reference {
  type: ReferenceType.CP;
  /** 程序版本 */
  programVersion?: string;
  /** 运行环境 */
  runtimeEnvironment?: string;
}

/**
 * 数据库接口
 */
export interface Database extends Reference {
  type: ReferenceType.DB;
  /** 数据库名称 */
  databaseName?: string;
  /** 访问日期 */
  accessDate?: string;
}

/**
 * 其他文献接口
 */
export interface Other extends Reference {
  type: ReferenceType.Z;
}

/**
 * 所有文献类型的联合类型
 */
export type ReferenceUnion =
  | Reference
  | Journal
  | Newspaper
  | Serial
  | Book
  | Thesis
  | Proceedings
  | Report
  | Standard
  | Patent
  | WebPage
  | Archive
  | Map
  | Dataset
  | Preprint
  | ComponentPart
  | Compilation
  | ComputerProgram
  | Database
  | Other;

/**
 * 解析选项
 */
export interface ParseOptions {
  /** 标准版本，默认 '2025' */
  version?: StandardVersion;
  /** 严格模式，默认 false（容错模式） */
  strict?: boolean;
  /** 是否保留序号 */
  preserveId?: boolean;
  /** 输出语言 */
  locale?: 'zh' | 'en';
  /** 标引体系：顺序编码制 | 著者-出版年制 */
  citationStyle?: CitationStyle;
}

/**
 * 格式化选项
 */
export interface FormatOptions {
  /** 输出标准版本，默认 '2025' */
  version?: StandardVersion;
  /** 标引体系 */
  citationStyle?: CitationStyle;
  /** 是否输出引用日期（网站/网页必备） */
  includeAccessDate?: boolean;
  /** 输出语言，默认 'zh'（影响"等"/"et al."） */
  locale?: 'zh' | 'en';
}

/**
 * 解析阶段错误码
 */
export const ParseErrorCode = {
  /** 未找到匹配的解析器 */
  NO_MATCH: 'NO_MATCH' as const,
  /** 解析过程中发生异常 */
  PARSE_ERROR: 'PARSE_ERROR' as const,
  /** 通用解析结果不完整（fallback） */
  GENERIC_FALLBACK: 'GENERIC_FALLBACK' as const,
} as const;

export type ParseErrorCode = (typeof ParseErrorCode)[keyof typeof ParseErrorCode];

/**
 * 解析阶段结构化错误
 */
export interface ParseError {
  code: ParseErrorCode;
  message: string;
  /** token 序列中的位置，-1 表示未知 */
  position?: number;
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 解析成功的文献 */
  reference: ReferenceUnion;
  /** 警告信息（保留字符串版本供向后兼容） */
  warnings: string[];
  /** 结构化错误列表（新增） */
  errors: ParseError[];
}

/**
 * 校验错误码
 */
export const ValidationErrorCode = {
  /** 必填字段缺失 */
  MISSING_REQUIRED: 'MISSING_REQUIRED' as const,
  /** 日期格式无效 */
  INVALID_DATE: 'INVALID_DATE' as const,
  /** 年份格式无效 */
  INVALID_YEAR: 'INVALID_YEAR' as const,
  /** 作者格式无效 */
  INVALID_AUTHOR: 'INVALID_AUTHOR' as const,
  /** 文献类型特有字段缺失 */
  MISSING_TYPE_FIELD: 'MISSING_TYPE_FIELD' as const,
} as const;

export type ValidationErrorCode =
  (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];

/**
 * 校验错误
 */
export interface ValidationError {
  /** 错误码 */
  code?: ValidationErrorCode;
  /** 错误字段 */
  field: string;
  /** 错误信息 */
  message: string;
  /** 错误级别 */
  level: 'error' | 'warning';
  /** 来源字符串位置（可选） */
  position?: number;
}

/**
 * 校验报告
 */
export interface ValidationReport {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误列表 */
  errors: ValidationError[];
}

/**
 * 正文引用标注解析结果
 */
export interface ParseCitationResult {
  /** 引用类型 */
  type: 'numeric' | 'author-date' | 'unknown';
  /** 序号列表（仅 numeric） */
  ids?: string[];
  /** 作者姓名（仅 author-date） */
  author?: string;
  /** 年份（仅 author-date） */
  year?: string;
  /** 后缀如页码（仅 author-date） */
  suffix?: string;
  /** 无法识别时返回原始输入 */
  input?: string;
}

/**
 * 词法单元类型
 */
export type TokenType =
  | 'BRACKET_OPEN'
  | 'BRACKET_CLOSE'
  | 'NUMBER'
  | 'DOT'
  | 'COMMA'
  | 'COLON'
  | 'SEMICOLON'
  | 'SLASH'
  | 'DOUBLE_SLASH'
  | 'PAREN_OPEN'
  | 'PAREN_CLOSE'
  | 'DASH'
  | 'AUTHOR'
  | 'TITLE'
  | 'TYPE_INDICATOR'
  | 'MEDIA_INDICATOR'
  | 'JOURNAL'
  | 'YEAR'
  | 'VOLUME'
  | 'ISSUE'
  | 'PAGES'
  | 'URL'
  | 'PID'
  | 'DATE'
  | 'TEXT'
  | 'UNKNOWN';

/**
 * 词法单元
 */
export interface Token {
  /** 单元类型 */
  type: TokenType;
  /** 单元值 */
  value: string;
  /** 在原文中的位置 */
  position: number;
}
