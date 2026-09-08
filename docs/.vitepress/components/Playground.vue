<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { parse, format, validate, parseCitation } from '../../../src/index.ts'

type Mode = 'parse' | 'format' | 'validate'

const input = ref('[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22. DOI:10.1234/test')
const mode = ref<Mode>('parse')
const output = ref('')
const errors = ref<string[]>([])
const warnings = ref<string[]>([])
const isValid = ref<boolean | null>(null)

// 解析选项
const parseVersion = ref<'2015' | '2025'>('2025')
const preserveId = ref(false)

// 格式化选项
const formatVersion = ref<'2015' | '2025'>('2025')

// 示例输入
const examples = {
  parse: [
    '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.',
    '[2] 李四. 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.',
    '[3] 王琦. 融合星载GNSS-R数据的土壤湿度反演方法研究[D]. 武汉: 武汉大学, 2022: 87.',
    '[4] Myburg A A, Grattapaglia D, et al. The genome of Eucalyptus grandis[J/OL]. Nature, 2014, 510: 356-362.',
    '[5] GB/T 7714-2025 信息与文献 参考文献著录规则[S]. 北京: 中国标准出版社, 2025.',
    '(张三, 2025)',
    '[1,2,3]',
  ],
  format: [],
  validate: []
}

// 预设的格式化输入（需要先解析才能格式化）
const formatInput = ref('[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.')

const processInput = () => {
  errors.value = []
  warnings.value = []
  output.value = ''
  isValid.value = null

  if (!input.value.trim()) {
    errors.value = ['请输入参考文献']
    return
  }

  try {
    if (mode.value === 'parse') {
      const result = parse(input.value, {
        version: parseVersion.value,
        preserveId: preserveId.value
      })
      
      output.value = JSON.stringify(result.reference, null, 2)
      warnings.value = result.warnings || []
      
    } else if (mode.value === 'format') {
      // 先解析，再格式化
      const parseResult = parse(input.value, {
        version: formatVersion.value
      })
      
      const formatted = format(parseResult.reference, {
        version: formatVersion.value
      })
      
      output.value = formatted
      warnings.value = parseResult.warnings || []
      
    } else if (mode.value === 'validate') {
      const parseResult = parse(input.value)
      const report = validate(parseResult.reference)
      
      isValid.value = report.valid
      output.value = JSON.stringify(report, null, 2)
      warnings.value = parseResult.warnings || []
      
      if (!report.valid) {
        errors.value = report.errors.map(e => `[${e.level}] ${e.field}: ${e.message}`)
      }
    }
  } catch (e) {
    errors.value = [e instanceof Error ? e.message : '解析失败']
  }
}

const loadExample = (example: string) => {
  input.value = example
  processInput()
}

const copyOutput = async () => {
  if (output.value) {
    await navigator.clipboard.writeText(output.value)
  }
}

const modeLabel = computed(() => {
  switch (mode.value) {
    case 'parse': return '解析'
    case 'format': return '格式化'
    case 'validate': return '校验'
  }
})

watch(mode, () => {
  output.value = ''
  errors.value = []
  warnings.value = []
  isValid.value = null
})
</script>

<template>
  <div class="playground-container">
    <div class="playground-header">
      <h3 style="margin: 0;">在线 Playground</h3>
      <div class="playground-tabs">
        <button 
          class="playground-tab"
          :class="{ active: mode === 'parse' }"
          @click="mode = 'parse'"
        >
          解析
        </button>
        <button 
          class="playground-tab"
          :class="{ active: mode === 'format' }"
          @click="mode = 'format'"
        >
          格式化
        </button>
        <button 
          class="playground-tab"
          :class="{ active: mode === 'validate' }"
          @click="mode = 'validate'"
        >
          校验
        </button>
      </div>
    </div>

    <!-- 解析选项 -->
    <div class="playground-options" v-if="mode === 'parse'">
      <div class="playground-option">
        <label>标准版本:</label>
        <select v-model="parseVersion">
          <option value="2015">GB/T 7714-2015</option>
          <option value="2025">GB/T 7714-2025</option>
        </select>
      </div>
      <div class="playground-option">
        <label>
          <input type="checkbox" v-model="preserveId">
          保留序号
        </label>
      </div>
    </div>

    <!-- 格式化选项 -->
    <div class="playground-options" v-if="mode === 'format'">
      <div class="playground-option">
        <label>输出版本:</label>
        <select v-model="formatVersion">
          <option value="2015">GB/T 7714-2015</option>
          <option value="2025">GB/T 7714-2025</option>
        </select>
      </div>
    </div>

    <!-- 示例输入 -->
    <div class="playground-examples">
      <div class="playground-examples-title">示例:</div>
      <div class="playground-example-buttons">
        <button 
          class="playground-example-button"
          v-for="(example, index) in examples.parse"
          :key="index"
          @click="loadExample(example)"
        >
          示例 {{ index + 1 }}
        </button>
      </div>
    </div>

    <!-- 输入 -->
    <textarea 
      class="playground-input"
      v-model="input"
      :placeholder="mode === 'parse' ? '请输入参考文献字符串...' : '请输入参考文献字符串...'"
    ></textarea>

    <!-- 操作按钮 -->
    <div class="playground-actions">
      <button 
        class="playground-button"
        @click="processInput"
      >
        {{ modeLabel }}
      </button>
    </div>

    <!-- 结果 -->
    <div class="playground-result" v-if="output">
      <div class="playground-result-header">
        <span>结果</span>
        <button class="playground-copy-button" @click="copyOutput">
          复制
        </button>
      </div>
      <div class="playground-result-content">{{ output }}</div>
    </div>

    <!-- 校验成功 -->
    <div class="playground-success" v-if="isValid === true">
      ✓ 校验通过，该引用符合 GB/T 7714 规范
    </div>

    <!-- 错误 -->
    <div class="playground-error" v-if="errors.length > 0">
      <div v-for="(error, index) in errors" :key="index">{{ error }}</div>
    </div>

    <!-- 警告 -->
    <div class="playground-warnings" v-if="warnings.length > 0">
      <div style="font-weight: 500; margin-bottom: 8px;">警告:</div>
      <div v-for="(warning, index) in warnings" :key="index">{{ warning }}</div>
    </div>
  </div>
</template>
