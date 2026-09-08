# validate

校验文献格式是否符合 GB/T 7714 规范。

## 函数签名

```typescript
function validate(
  reference: ReferenceUnion,
  options?: ValidateOptions
): ValidationReport
```

## 参数

### reference

- 类型: `ReferenceUnion`
- 必填: 是

要校验的结构化引用对象。

### options

- 类型: `ValidateOptions`
- 必填: 否

校验选项。

```typescript
interface ValidateOptions {
  version?: '2015' | '2025';  // 标准版本，默认 '2025'
  strict?: boolean;           // 严格模式，默认 false
}
```

## 返回值

```typescript
interface ValidationReport {
  valid: boolean;           // 是否校验通过
  errors: ValidationError[];  // 错误列表
}

interface ValidationError {
  field: string;     // 字段名
  message: string;   // 错误信息
  level: 'error' | 'warning';  // 错误级别
}
```

## 示例

### 基本校验

```typescript
import { parse, validate } from 'gb7714-parser';

const result = parse('[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.');
const report = validate(result.reference);

console.log(report.valid); // true
console.log(report.errors); // []
```

### 校验失败

```typescript
const result = parse('[1] . 论文标题[J]. 期刊名，2025，1：1-10.');
const report = validate(result.reference);

console.log(report.valid); // false
console.log(report.errors);
// [
//   {
//     field: 'authors',
//     message: '作者不能为空',
//     level: 'error'
//   }
// ]
```

### 校验特定字段

```typescript
const result = parse('[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.');
const report = validate(result.reference);

// 检查是否有作者相关错误
const authorErrors = report.errors.filter(e => e.field === 'authors');
console.log(authorErrors.length); // 0
```

### 严格模式

```typescript
const report = validate(reference, { strict: true });
```

### 不同版本校验

```typescript
// 使用 2015 版本校验
const report = validate(reference, { version: '2015' });
```

## 校验规则

### 必填字段

- `title`: 所有文献类型都需要标题
- `authors`: 除标准外，其他类型都需要作者
- `journalTitle`: 期刊类型需要刊名
- `publisherPlace` / `publisher`: 图书类型需要出版地和出版者
- `awardInstitution`: 学位论文需要授予单位
- `standardNumber` / `standardName`: 标准需要标准号和标准名称
- `patentNumber`: 专利需要专利号

### 格式校验

- `year`: 年份必须是 4 位数字
- `accessDate`: 访问日期必须是 YYYY-MM-DD 格式

### 警告

- 作者超过 3 个时会发出警告（非严格模式）
- 缺少卷号或期号时会发出警告
