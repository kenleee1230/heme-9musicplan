// 存储键 (保留旧键用于数据迁移)
export const STORAGE_KEY = 'musicplan_songs'
export const START_DATE_KEY = 'musicplan_start_date'
export const TIME_CONFIG_KEY = 'musicplan_time_config'
export const TIMER_STORAGE_KEY = 'musicplan_timer'
export const SYNC_QUEUE_KEY = 'musicplan_sync_queue'

// 新存储键
export const PATTR_WORKSPACES_KEY = 'pattr_workspaces'
export const PATTR_PROJECTS_KEY = 'pattr_projects'
export const PATTR_TRACKS_KEY = 'pattr_tracks'
export const PATTR_WORKFLOWS_KEY = 'pattr_workflows'
export const PATTR_ACTIVE_WORKSPACE_KEY = 'pattr_active_workspace'
export const PATTR_ACTIVE_PROJECT_KEY = 'pattr_active_project'

// 项目配置
export const TOTAL_DAYS = 180
export const TARGET_SONGS = 9
export const HOURS_PER_SONG = 40
export const MAX_HOURS_PER_DAY = 6
export const RECOMMENDED_HOURS_PER_DAY = 2
export const DEFAULT_LEARNING_HOURS = 0.5
export const DEFAULT_MAKING_HOURS = 2

// 任务列表
export const TASKS = [
  '新曲风前期准备（至少一周）：听10张专辑，搜索曲风介绍（BPM、配器音色、代表人物、经典曲目、最新曲目）',
  '确定子曲风，找到3首参考歌，发给队长',
  '制作Demo，自己觉得OK',
  'Demo发给队长，获取意见',
  '完成编曲',
  '编曲发给队长，获取意见',
  '编曲OK，开始混音母带',
  '混音母带发给队长，获取意见',
  '队长OK，发给校长',
  '校长OK，完成制作'
]

// 任务时长默认占比（基于40小时总时长）
export const TASK_TIME_RATIOS = [
  0.175, // 新曲风前期准备：7小时（17.5%）- 如果是新曲风，否则为0
  0.05,  // 确定子曲风：2小时（5%）
  0.20,  // 制作Demo：8小时（20%）
  0.025, // Demo审核：1小时（2.5%）
  0.30,  // 完成编曲：12小时（30%）
  0.025, // 编曲审核：1小时（2.5%）
  0.15,  // 混音母带：6小时（15%）
  0.025, // 混音审核：1小时（2.5%）
  0.025, // 队长审核：1小时（2.5%）
  0.025  // 校长审核：1小时（2.5%）
]

// 阶段列表
export const STAGES = [
  '曲风研究',
  'Demo制作',
  '编曲',
  '混音母带',
  '队长审核',
  '校长审核',
  '已完成'
]

// 五度圈
export const CIRCLE_OF_FIFTHS = [
  { major: 'C', minor: 'Am', sharps: 0, flats: 0 },
  { major: 'G', minor: 'Em', sharps: 1, flats: 0 },
  { major: 'D', minor: 'Bm', sharps: 2, flats: 0 },
  { major: 'A', minor: 'F#m', sharps: 3, flats: 0 },
  { major: 'E', minor: 'C#m', sharps: 4, flats: 0 },
  { major: 'B', minor: 'G#m', sharps: 5, flats: 0 },
  { major: 'F#', minor: 'D#m', sharps: 6, flats: 0 },
  { major: 'C#', minor: 'A#m', sharps: 7, flats: 0 },
  { major: 'F', minor: 'Dm', sharps: 0, flats: 1 },
  { major: 'Bb', minor: 'Gm', sharps: 0, flats: 2 },
  { major: 'Eb', minor: 'Cm', sharps: 0, flats: 3 },
  { major: 'Ab', minor: 'Fm', sharps: 0, flats: 4 }
]

// 音符到频率的映射（A4 = 440Hz）
export const NOTE_FREQUENCIES = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
  'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
}

// 和弦类型定义
export const CHORD_TYPES = {
  'major': { name: '大三和弦', intervals: [0, 4, 7], description: '由根音、大三度、纯五度组成，明亮、稳定' },
  'minor': { name: '小三和弦', intervals: [0, 3, 7], description: '由根音、小三度、纯五度组成，柔和、忧郁' },
  'augmented': { name: '增三和弦', intervals: [0, 4, 8], description: '由根音、大三度、增五度组成，紧张、不稳定' },
  'diminished': { name: '减三和弦', intervals: [0, 3, 6], description: '由根音、小三度、减五度组成，非常紧张、不稳定' },
  'dominant7': { name: '属七和弦', intervals: [0, 4, 7, 10], description: '由根音、大三度、纯五度、小七度组成，需要解决到主和弦' },
  'major7': { name: '大七和弦', intervals: [0, 4, 7, 11], description: '由根音、大三度、纯五度、大七度组成，爵士感、柔和' },
  'minor7': { name: '小七和弦', intervals: [0, 3, 7, 10], description: '由根音、小三度、纯五度、小七度组成，柔和、爵士感' }
}

// 常见和弦进行
export const COMMON_PROGRESSIONS = [
  { name: '流行进行', degrees: 'I-V-VI-IV', description: '最流行的和弦进行，出现在无数流行歌曲中' },
  { name: '爵士进行', degrees: 'II-V-I', description: '经典的爵士和弦进行，II级、V级、I级，是爵士音乐的基础' },
  { name: '卡农进行', degrees: 'VI-IV-I-V', description: '帕赫贝尔卡农的经典和弦进行，非常优美，适合抒情歌曲' },
  { name: '五十年代进行', degrees: 'I-VI-IV-V', description: '50年代流行音乐常用的和弦进行' },
  { name: '小调进行', degrees: 'I-IV-V', description: '小调中常见的和弦进行，柔和、忧郁（I和IV为小三和弦）' },
  { name: '蓝调进行', degrees: 'I-I-I-I-IV-IV-I-I-V-IV-I-V', description: '12小节蓝调进行，是蓝调音乐的标准形式' }
]

// 中古调式音程结构
export const MODAL_SCALES = {
  'lydian': { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], description: '全全全半全全半 - 最明亮，带有增四度的神秘感' },
  'ionian': { name: 'Ionian (Major)', intervals: [0, 2, 4, 5, 7, 9, 11], description: '全全半全全全半 - 大调音阶，明亮稳定' },
  'mixolydian': { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], description: '全全半全全半全 - 属调式，带有小七度的爵士感' },
  'dorian': { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], description: '全半全全全半全 - 小调色彩但带有大六度，柔和而明亮' },
  'aeolian': { name: 'Aeolian (Minor)', intervals: [0, 2, 3, 5, 7, 8, 10], description: '全半全全半全全 - 自然小调，柔和忧郁' },
  'phrygian': { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], description: '半全全全半全全 - 带有小二度的异域感，神秘而紧张' },
  'locrian': { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], description: '半全全半全全全 - 最黑暗，带有减五度的不稳定感' }
}

// 各调的和弦级数映射
export const CHORD_DEGREES = {
  'C': { 'I': 'C', 'IIm': 'Dm', 'IIIm': 'Em', 'IV': 'F', 'V': 'G', 'VIm': 'Am', 'VII°': 'Bdim' },
  'G': { 'I': 'G', 'IIm': 'Am', 'IIIm': 'Bm', 'IV': 'C', 'V': 'D', 'VIm': 'Em', 'VII°': 'F#dim' },
  'D': { 'I': 'D', 'IIm': 'Em', 'IIIm': 'F#m', 'IV': 'G', 'V': 'A', 'VIm': 'Bm', 'VII°': 'C#dim' },
  'A': { 'I': 'A', 'IIm': 'Bm', 'IIIm': 'C#m', 'IV': 'D', 'V': 'E', 'VIm': 'F#m', 'VII°': 'G#dim' },
  'E': { 'I': 'E', 'IIm': 'F#m', 'IIIm': 'G#m', 'IV': 'A', 'V': 'B', 'VIm': 'C#m', 'VII°': 'D#dim' },
  'B': { 'I': 'B', 'IIm': 'C#m', 'IIIm': 'D#m', 'IV': 'E', 'V': 'F#', 'VIm': 'G#m', 'VII°': 'A#dim' },
  'F#': { 'I': 'F#', 'IIm': 'G#m', 'IIIm': 'A#m', 'IV': 'B', 'V': 'C#', 'VIm': 'D#m', 'VII°': 'E#dim' },
  'C#': { 'I': 'C#', 'IIm': 'D#m', 'IIIm': 'E#m', 'IV': 'F#', 'V': 'G#', 'VIm': 'A#m', 'VII°': 'B#dim' },
  'F': { 'I': 'F', 'IIm': 'Gm', 'IIIm': 'Am', 'IV': 'Bb', 'V': 'C', 'VIm': 'Dm', 'VII°': 'Edim' },
  'Bb': { 'I': 'Bb', 'IIm': 'Cm', 'IIIm': 'Dm', 'IV': 'Eb', 'V': 'F', 'VIm': 'Gm', 'VII°': 'Adim' },
  'Eb': { 'I': 'Eb', 'IIm': 'Fm', 'IIIm': 'Gm', 'IV': 'Ab', 'V': 'Bb', 'VIm': 'Cm', 'VII°': 'Ddim' },
  'Ab': { 'I': 'Ab', 'IIm': 'Bbm', 'IIIm': 'Cm', 'IV': 'Db', 'V': 'Eb', 'VIm': 'Fm', 'VII°': 'Gdim' }
}

// 编曲/混音小知识库（精简版）
export const KNOWLEDGE_BASE = [
  { title: "频率平衡", content: "混音时，确保低频（20-200Hz）、中频（200-2kHz）和高频（2k-20kHz）的能量分布均衡。使用频谱分析仪可以帮助你直观看到频率分布。" },
  { title: "空间感营造", content: "使用混响和延迟来创造空间感。短混响（0.5-1秒）适合节奏乐器，长混响（2-4秒）适合主旋律和背景元素。" },
  { title: "动态处理", content: "压缩器不是用来让声音更大，而是用来控制动态范围。适度的压缩（2:1到4:1）可以让声音更稳定，过度压缩会让音乐失去生命力。" },
  { title: "侧链压缩", content: "在电子音乐中，使用侧链压缩让底鼓和贝斯不冲突。当底鼓响起时，贝斯音量自动降低，创造经典的'pumping'效果。" },
  { title: "EQ技巧", content: "减法EQ比加法EQ更有效。先削减不需要的频率，再适当提升需要的频率。记住：每个频率的提升都会影响整体平衡。" },
  { title: "母带处理", content: "母带处理是最后一步，用来统一整首歌的音量和音色。使用多段压缩和立体声增强器，但要保持克制，过度处理会破坏音乐的自然感。" },
  { title: "参考曲目", content: "制作时经常对比参考曲目，但不要完全模仿。分析参考曲目的频率分布、动态范围和空间感，然后应用到自己的作品中。" },
  { title: "监听环境", content: "在不同的监听设备上测试你的混音：耳机、音箱、手机。如果混音在所有这些设备上都听起来不错，说明你的混音是成功的。" },
  { title: "休息的重要性", content: "制作音乐时，耳朵会疲劳。每工作1-2小时休息15分钟，让耳朵恢复敏感度。第二天再听，你可能会发现之前没注意到的问题。" },
  { title: "自动化", content: "使用自动化来创造动态变化。音量、滤波器、效果器参数的自动化可以让音乐更有生命力，避免静态和单调。" },
  { title: "编曲层次", content: "好的编曲有清晰的层次：主旋律、和声、节奏、低音。确保每个层次都有其独特的频率空间，避免相互掩蔽。" },
  { title: "和声进行", content: "学习和声理论，但不要被规则束缚。经典的和声进行（如I-V-vi-IV）之所以经典，是因为它们有效。在此基础上创新。" },
  { title: "节奏变化", content: "在编曲中适当改变节奏密度。主歌可以稀疏，副歌可以密集，桥段可以完全改变节奏，创造对比和张力。" },
  { title: "乐器编排", content: "合理安排乐器出场顺序，避免混乱。主歌可以只有少数乐器，副歌可以加入更多元素，创造层次感。" },
  { title: "音色搭配", content: "确保不同乐器的音色和谐，避免冲突。选择互补的音色，而不是相似的声音。" },
  { title: "合成器基础", content: "了解振荡器、滤波器、包络、LFO的基本原理。振荡器产生波形，滤波器改变音色，包络控制动态，LFO创造运动。" },
  { title: "滤波器类型", content: "低通滤波器让高频通过，高通滤波器让低频通过，带通滤波器只让特定频段通过。每种都有不同的音色特点。" },
  { title: "包络发生器", content: "ADSR包络控制音色的起音、衰减、延音、释音。快起音适合打击乐，慢起音适合弦乐。" },
  { title: "音色分层", content: "将多个音色层叠可以创造更丰富的声音。每层可以有不同的音色、音量和效果。" },
  { title: "立体声制作", content: "合理使用立体声可以增加音乐的宽度和空间感。主要元素放中央，辅助元素分布两侧，创造立体感。" }
]

// 工作流模板
export const WORKFLOW_TEMPLATES = [
  // 180天音乐计划专用（新手）
  {
    id: 'beginner-180-workflow',
    name: '180天计划 - 新曲风完整流程',
    description: '适合新手学习新曲风，包含完整的研究和审核流程',
    isDefault: true,
    isCustom: false,
    applicableTypes: ['song', 'track'],
    projectTypes: ['beginner-180'],
    steps: [
      { name: '新曲风前期准备（至少一周）：听10张专辑，搜索曲风介绍（BPM、配器音色、代表人物、经典曲目、最新曲目）', estimatedHours: 7, description: '深入研究新曲风' },
      { name: '确定子曲风，找到3首参考歌，发给队长', estimatedHours: 2, description: '明确创作方向' },
      { name: '制作Demo，自己觉得OK', estimatedHours: 8, description: '初步创作' },
      { name: 'Demo发给队长，获取意见', estimatedHours: 1, description: '反馈与调整' },
      { name: '完成编曲', estimatedHours: 12, description: '详细编曲制作' },
      { name: '编曲发给队长，获取意见', estimatedHours: 1, description: '编曲审核' },
      { name: '编曲OK，开始混音母带', estimatedHours: 6, description: '混音和母带处理' },
      { name: '混音母带发给队长，获取意见', estimatedHours: 1, description: '混音审核' },
      { name: '队长OK，发给校长', estimatedHours: 1, description: '最终审核' },
      { name: '校长OK，完成制作', estimatedHours: 1, description: '项目完成' }
    ]
  },
  
  // 专业音乐人 - 自定义项目
  {
    id: 'professional-workflow',
    name: '专业流程 - 熟悉曲风',
    description: '适合有经验的音乐人，跳过前期研究，更高效的制作流程',
    isDefault: true,
    isCustom: false,
    applicableTypes: ['song', 'track'],
    projectTypes: ['professional-custom'],
    steps: [
      { name: '确定创作方向和参考', estimatedHours: 1.5, description: '快速定位风格' },
      { name: '制作Demo', estimatedHours: 6, description: '初步创作' },
      { name: 'Demo自审与调整', estimatedHours: 1, description: '自我评估' },
      { name: '完成编曲', estimatedHours: 10, description: '详细编曲制作' },
      { name: '编曲审核与修改', estimatedHours: 1.5, description: '编曲完善' },
      { name: '混音母带', estimatedHours: 5, description: '混音和母带处理' },
      { name: '最终审核与完成', estimatedHours: 1, description: '项目完成' }
    ]
  },
  
  // 单曲制作
  {
    id: 'single-production-workflow',
    name: '单曲制作流程',
    description: '适合精心打磨一首单曲，注重质量和细节',
    isDefault: true,
    isCustom: false,
    applicableTypes: ['song', 'track'],
    projectTypes: ['single-track'],
    steps: [
      { name: '概念和灵感开发', estimatedHours: 3, description: '确定歌曲主题和情绪' },
      { name: '曲风研究和参考分析', estimatedHours: 4, description: '深入分析参考曲目' },
      { name: '创作Demo（旋律+和声）', estimatedHours: 8, description: '核心音乐元素' },
      { name: 'Demo审核和优化', estimatedHours: 2, description: '完善Demo' },
      { name: '详细编曲制作', estimatedHours: 15, description: '精细编曲' },
      { name: '编曲细节打磨', estimatedHours: 5, description: '音色和细节' },
      { name: '初步混音', estimatedHours: 6, description: '平衡和EQ' },
      { name: '混音细节处理', estimatedHours: 4, description: '效果和自动化' },
      { name: '母带处理', estimatedHours: 2, description: '最终母带' },
      { name: '多设备试听和调整', estimatedHours: 2, description: '确保各设备表现良好' },
      { name: '最终审核和导出', estimatedHours: 1, description: '项目完成' }
    ]
  },
  
  // EP制作
  {
    id: 'ep-production-workflow',
    name: 'EP制作流程',
    description: '适合EP项目，平衡效率和质量，保持风格统一',
    isDefault: true,
    isCustom: false,
    applicableTypes: ['song', 'track'],
    projectTypes: ['ep-production'],
    steps: [
      { name: 'EP主题和风格定位', estimatedHours: 2, description: '确定整体方向' },
      { name: '参考分析和规划', estimatedHours: 2, description: '分析参考和计划' },
      { name: '创作Demo', estimatedHours: 6, description: '初步创作' },
      { name: 'Demo审核', estimatedHours: 1, description: '确认方向' },
      { name: '完成编曲', estimatedHours: 12, description: '详细编曲' },
      { name: '编曲审核和调整', estimatedHours: 2, description: '确保风格统一' },
      { name: '混音处理', estimatedHours: 6, description: '混音' },
      { name: '母带处理', estimatedHours: 2, description: '母带' },
      { name: '最终审核', estimatedHours: 1, description: '完成' }
    ]
  },
  
  // 专辑制作
  {
    id: 'album-production-workflow',
    name: '专辑制作流程',
    description: '适合专辑项目，注重整体性和专业度',
    isDefault: true,
    isCustom: false,
    applicableTypes: ['song', 'track'],
    projectTypes: ['album-production'],
    steps: [
      { name: '专辑概念和主题开发', estimatedHours: 3, description: '确定专辑整体概念' },
      { name: '曲风和风格研究', estimatedHours: 3, description: '深入研究风格' },
      { name: '创作Demo', estimatedHours: 6, description: '初步创作' },
      { name: 'Demo审核和方向确认', estimatedHours: 1.5, description: '确认符合专辑主题' },
      { name: '详细编曲制作', estimatedHours: 12, description: '精细编曲' },
      { name: '编曲审核和风格统一', estimatedHours: 2, description: '确保专辑一致性' },
      { name: '混音处理', estimatedHours: 6, description: '专业混音' },
      { name: '母带处理', estimatedHours: 2, description: '统一母带标准' },
      { name: '专辑整体审核', estimatedHours: 1.5, description: '确保专辑完整性' },
      { name: '最终调整和导出', estimatedHours: 1, description: '项目完成' }
    ]
  },
  
  // 混音项目专用
  {
    id: 'mixing-project-workflow',
    name: '混音项目流程',
    description: '专注于混音和母带处理，适合接单或为他人混音',
    isDefault: true,
    isCustom: false,
    applicableTypes: ['mix', 'mastering'],
    projectTypes: ['mixing-project'],
    steps: [
      { name: '接收和整理素材', estimatedHours: 0.5, description: '检查音轨文件' },
      { name: '分析原始音轨', estimatedHours: 1, description: '了解音乐内容和需求' },
      { name: '音轨整理和分组', estimatedHours: 1, description: '组织工程文件' },
      { name: '初步平衡和增益调整', estimatedHours: 2, description: '设置基础音量' },
      { name: 'EQ处理', estimatedHours: 3, description: '频率平衡' },
      { name: '压缩和动态处理', estimatedHours: 2.5, description: '控制动态' },
      { name: '空间效果（混响、延迟）', estimatedHours: 2, description: '营造空间感' },
      { name: '自动化和细节调整', estimatedHours: 2, description: '动态变化' },
      { name: '母带处理', estimatedHours: 1.5, description: '最终母带' },
      { name: '多设备试听和调整', estimatedHours: 1, description: '确保兼容性' },
      { name: '导出和交付', estimatedHours: 0.5, description: '完成交付' }
    ]
  }
]

// 项目模板
export const PROJECT_TEMPLATES = [
  {
    id: 'beginner-180',
    name: '新手音乐人计划',
    description: '180天内完成9首歌曲，适合刚结课的学员',
    type: 'album',
    defaultName: '180天音乐计划',
    defaultDuration: 180,
    defaultTargetCount: 9,
    defaultDailyHours: 2,
    autoSchedule: true,
    defaultWorkflowId: 'beginner-180-workflow',
    defaultMilestones: [
      { name: '完成第1首歌', description: '迈出第一步' },
      { name: '完成第3首歌', description: '25%进度达成' },
      { name: '完成第5首歌', description: '过半完成' },
      { name: '完成第7首歌', description: '75%进度达成' },
      { name: '完成全部9首歌', description: '计划圆满完成' }
    ],
    icon: '🎓'
  },
  {
    id: 'professional-custom',
    name: '专业音乐人',
    description: '自定义时间和目标，适合有经验的音乐人',
    type: 'custom',
    defaultName: '我的音乐项目',
    defaultDuration: null,
    defaultTargetCount: null,
    defaultDailyHours: 3,
    autoSchedule: false,
    defaultWorkflowId: 'professional-workflow',
    defaultMilestones: [],
    icon: '🎹'
  },
  {
    id: 'single-track',
    name: '单曲制作',
    description: '30-60天完成一首高质量单曲',
    type: 'single',
    defaultName: '单曲项目',
    defaultDuration: 45,
    defaultTargetCount: 1,
    defaultDailyHours: 2,
    autoSchedule: true,
    defaultWorkflowId: 'single-production-workflow',
    defaultMilestones: [
      { name: 'Demo完成', description: '初步创作完成' },
      { name: '编曲完成', description: '编曲定稿' },
      { name: '混音完成', description: '混音定稿' },
      { name: '母带完成', description: '作品完成' }
    ],
    icon: '🎵'
  },
  {
    id: 'ep-production',
    name: 'EP制作',
    description: '3-6首歌的EP项目',
    type: 'ep',
    defaultName: 'EP项目',
    defaultDuration: 90,
    defaultTargetCount: 4,
    defaultDailyHours: 2.5,
    autoSchedule: true,
    defaultWorkflowId: 'ep-production-workflow',
    defaultMilestones: [
      { name: '确定EP主题和风格', description: '统一风格定位' },
      { name: '完成一半曲目', description: '进度过半' },
      { name: '所有编曲完成', description: '编曲阶段结束' },
      { name: 'EP完整混音', description: '统一混音标准' },
      { name: 'EP发布准备', description: '项目完成' }
    ],
    icon: '💿'
  },
  {
    id: 'album-production',
    name: '专辑制作',
    description: '8-12首歌的完整专辑',
    type: 'album',
    defaultName: '专辑项目',
    defaultDuration: 180,
    defaultTargetCount: 10,
    defaultDailyHours: 3,
    autoSchedule: true,
    defaultWorkflowId: 'album-production-workflow',
    defaultMilestones: [
      { name: '专辑概念确定', description: '主题和风格定位' },
      { name: '完成30%曲目', description: '初期进展' },
      { name: '完成60%曲目', description: '进度过半' },
      { name: '所有编曲完成', description: '编曲阶段结束' },
      { name: '专辑统一混音', description: '整体音色统一' },
      { name: '专辑发布准备', description: '项目完成' }
    ],
    icon: '💽'
  },
  {
    id: 'mixing-project',
    name: '混音项目',
    description: '专注于混音和母带处理',
    type: 'mixing',
    defaultName: '混音项目',
    defaultDuration: 30,
    defaultTargetCount: 5,
    defaultDailyHours: 2,
    autoSchedule: true,
    defaultWorkflowId: 'mixing-project-workflow',
    defaultMilestones: [
      { name: '完成一半混音', description: '进度过半' },
      { name: '所有混音完成', description: '混音阶段结束' },
      { name: '母带处理完成', description: '项目完成' }
    ],
    icon: '🎚️'
  }
]
