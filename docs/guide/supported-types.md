# 支持的文献类型

GB/T 7714 Parser 支持以下 17 种文献类型：

| 类型标识 | 名称       | 说明                             |
| :------- | :--------- | :------------------------------- |
| `J`      | 期刊       | Journal article                  |
| `M`      | 图书       | Book (旧称"专著")                |
| `D`      | 学位论文   | Dissertation/Thesis              |
| `C`      | 会议录     | Conference proceedings           |
| `R`      | 报告       | Report                           |
| `S`      | 标准       | Standard                         |
| `P`      | 专利       | Patent                           |
| `EB`     | 网站/网页  | Website/Webpage (旧称"电子公告") |
| `A`      | 档案       | Archive (2025新增)               |
| `N`      | 报纸       | Newspaper                        |
| `CM`     | 地图       | Map (旧称"舆图")                 |
| `DS`     | 数据集     | Dataset (2025新增)               |
| `PP`     | 预印本     | Preprint (2025新增)              |
| `G`      | 汇编       | Compilation                      |
| `CP`     | 计算机程序 | Computer program                 |
| `DB`     | 数据库     | Database                         |
| `Z`      | 其他       | Other                            |

## 载体标识

对于电子资源，可以附加载体标识：

| 载体标识 | 说明     |
| :------- | :------- |
| `OL`     | 在线     |
| `CD`     | 光盘     |
| `DK`     | 磁盘     |
| `FB`     | 软盘     |

示例：`[J/OL]` 表示在线期刊文章

## 解析示例

### 期刊 [J]

```typescript
// 来自 GB/T 7714-2025 标准 B.4 示例
const result = parse(
  '[1] 于潇，刘义，柴跃廷，等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版），2012，52(11): 1518-1523.'
);
```

### 图书 [M]

```typescript
// 来自 GB/T 7714-2025 标准 B.1 示例
const result = parse(
  '[1] 博伯尔. 银行业的未来与人工智能[M]. 徐超，译. 北京: 清华大学出版社, 2023: 35.'
);
```

### 学位论文 [D]

```typescript
// 来自 GB/T 7714-2025 标准 B.6 示例
const result = parse(
  '[1] 王琦. 融合星载 GNSS-R 和 SAR 数据的高时空分辨率土壤湿度反演方法研究[D]. 武汉: 武汉大学, 2022: 87.'
);
```

### 在线文献 [J/OL]

```typescript
// 来自 GB/T 7714-2025 标准 B.4 示例
const result = parse(
  '[1] Myburg A A, Grattapaglia D, Tuskan G A, et al. The genome of Eucalyptus grandis[J/OL]. Nature, 2014, 510: 356-362.'
);
```

### 标准 [S]

```typescript
// 来自 GB/T 7714-2025 标准 B.8 示例
const result = parse(
  '[1] GB/T 3792—2021 信息与文献 资源描述[S].'
);
```

### 会议录 [C]

```typescript
// 来自 GB/T 7714-2025 标准 B.5 示例
const result = parse(
  '[1] 牛志明，Swingland I R，雷光春. 综合湿地管理：综合湿地管理国际研讨会论文集[C]. 北京: 海洋出版社, 2012.'
);
```
