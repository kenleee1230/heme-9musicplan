// 数据管理
const STORAGE_KEY = 'musicplan_songs';
const START_DATE_KEY = 'musicplan_start_date';
const TIME_CONFIG_KEY = 'musicplan_time_config';
const TOTAL_DAYS = 180; // 总天数（从开始日期算起）
const TARGET_SONGS = 9;
const HOURS_PER_SONG = 40; // 一首歌40有效小时
const MAX_HOURS_PER_DAY = 6; // 每天最多6有效小时
const RECOMMENDED_HOURS_PER_DAY = 2; // 推荐每天2小时（已养成的习惯）
const DEFAULT_LEARNING_HOURS = 0.5; // 默认每日学习时长
const DEFAULT_MAKING_HOURS = 2; // 默认每日制作时长

// 获取或设置开始日期
function getStartDate() {
    const saved = localStorage.getItem(START_DATE_KEY);
    if (saved) {
        const date = new Date(saved);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    // 如果没有设置，默认使用2025-11-08作为开始日期
    const defaultDate = new Date('2025-11-08');
    defaultDate.setHours(0, 0, 0, 0);
    setStartDate(defaultDate);
    return defaultDate;
}

// 设置开始日期
function setStartDate(date) {
    localStorage.setItem(START_DATE_KEY, date.toISOString());
}

// 时间配置管理
function getTimeConfig() {
    const saved = localStorage.getItem(TIME_CONFIG_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    const defaultConfig = {
        dailyLearningHours: DEFAULT_LEARNING_HOURS,
        dailyMakingHours: DEFAULT_MAKING_HOURS
    };
    setTimeConfig(defaultConfig);
    return defaultConfig;
}

function setTimeConfig(config) {
    localStorage.setItem(TIME_CONFIG_KEY, JSON.stringify(config));
}

function updateTimeConfig(learningHours, makingHours) {
    const config = {
        dailyLearningHours: Math.max(0, Math.min(2, learningHours)),
        dailyMakingHours: Math.max(0, Math.min(MAX_HOURS_PER_DAY, makingHours))
    };
    setTimeConfig(config);
    return config;
}

// 获取每日实际制作时间
function getDailyMakingTime() {
    const config = getTimeConfig();
    return Math.max(0, config.dailyMakingHours - config.dailyLearningHours);
}

// 计算剩余天数（动态计算）
function getRemainingDays() {
    const startDate = getStartDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + TOTAL_DAYS);
    
    const remaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining); // 确保不为负数
}

// 任务列表
const TASKS = [
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
];

// 任务时长默认占比（基于40小时总时长）
const TASK_TIME_RATIOS = [
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
];

// 阶段列表
const STAGES = [
    '曲风研究',
    'Demo制作',
    '编曲',
    '混音母带',
    '队长审核',
    '校长审核',
    '已完成'
];

// 编曲/混音小知识库（180条）
const KNOWLEDGE_BASE = [
    // 基础混音技巧 (1-30)
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
    { title: "相位问题", content: "检查立体声相位。如果左右声道相位相反，在单声道播放时会抵消。使用相位表或单声道监听来检查。" },
    { title: "低音处理", content: "低音（特别是sub-bass）在单声道中处理，因为人耳无法定位极低频。这样可以避免相位问题，确保在任何播放设备上都有稳定的低音。" },
    { title: "人声处理", content: "人声混音时，使用高通滤波器去除80Hz以下的低频噪音。在3-5kHz提升可以增加清晰度，在200-300Hz削减可以减少浑浊感。" },
    { title: "鼓组混音", content: "底鼓在60-80Hz有冲击力，军鼓在2-4kHz有穿透力。使用门限器去除不需要的共振，使用压缩器控制动态。" },
    { title: "立体声宽度", content: "主旋律和主唱通常放在中央，背景元素可以放在两侧。使用立体声增强器时要小心，过度处理会让声音不自然。" },
    { title: "混响发送", content: "使用发送式混响而不是插入式，这样可以更好地控制干湿比。多个轨道可以共享同一个混响，创造统一的空间感。" },
    { title: "延迟技巧", content: "延迟时间与歌曲速度相关。1/4音符延迟适合大多数情况，1/8音符延迟创造更快的节奏感，1/16音符延迟适合电子音乐。" },
    { title: "压缩器参数", content: "Attack控制压缩器反应速度：快attack（1-10ms）适合瞬态，慢attack（10-50ms）保留冲击力。Release控制恢复速度，通常设为50-200ms。" },
    { title: "多段压缩", content: "多段压缩可以分别处理不同频段。低频段压缩可以控制底鼓和贝斯，中频段压缩可以控制人声，高频段压缩可以控制镲片。" },
    { title: "饱和器使用", content: "饱和器可以增加谐波，让声音更温暖、更有质感。适度使用可以增加音乐的魅力，过度使用会让声音失真。" },
    { title: "门限器", content: "门限器可以去除背景噪音和不需要的声音。设置合适的阈值和释放时间，避免切断重要的声音。" },
    { title: "EQ频率记忆", content: "记住关键频率：60Hz底鼓冲击，200Hz浑浊，500Hz箱体感，1kHz中频，3kHz清晰度，5kHz亮度，10kHz空气感。" },
    { title: "音量平衡", content: "混音时先平衡音量，再处理效果。如果某个元素太突出，先降低音量，而不是增加其他元素。" },
    { title: "频率掩蔽", content: "当两个声音在相同频率时，较响的会掩蔽较弱的。使用EQ为每个元素创造独特的频率空间。" },
    { title: "瞬态处理", content: "瞬态处理器可以增强或减弱声音的起音。增强瞬态可以让鼓更有冲击力，减弱瞬态可以让声音更平滑。" },
    { title: "并行压缩", content: "并行压缩（New York压缩）将压缩后的信号与原始信号混合，既保留了动态，又增加了密度和冲击力。" },
    { title: "总线压缩", content: "在总线上使用轻微压缩（2:1，1-2dB增益衰减）可以让所有元素更好地融合在一起。" },
    { title: "限制器使用", content: "限制器是母带处理的最后一步，用来防止过载。设置合适的输出电平（-0.3dB到-1dB），避免削波失真。" },
    { title: "单声道检查", content: "经常切换到单声道模式检查混音。如果单声道听起来不错，立体声通常也会很好。这可以避免相位问题。" },
    { title: "频谱分析", content: "使用频谱分析仪查看频率分布，但不要完全依赖它。最终还是要用耳朵判断，因为频谱图不能告诉你音乐是否好听。" },
    
    // 编曲技巧 (31-60)
    { title: "编曲层次", content: "好的编曲有清晰的层次：主旋律、和声、节奏、低音。确保每个层次都有其独特的频率空间，避免相互掩蔽。" },
    { title: "和声进行", content: "学习和声理论，但不要被规则束缚。经典的和声进行（如I-V-vi-IV）之所以经典，是因为它们有效。在此基础上创新。" },
    { title: "节奏变化", content: "在编曲中适当改变节奏密度。主歌可以稀疏，副歌可以密集，桥段可以完全改变节奏，创造对比和张力。" },
    { title: "乐器编排", content: "合理安排乐器出场顺序，避免混乱。主歌可以只有少数乐器，副歌可以加入更多元素，创造层次感。" },
    { title: "音色搭配", content: "确保不同乐器的音色和谐，避免冲突。选择互补的音色，而不是相似的声音。" },
    { title: "节拍选择", content: "根据歌曲情感选择适当的节拍。4/4拍最常见，3/4拍适合华尔兹风格，6/8拍适合抒情歌曲。" },
    { title: "速度设定", content: "速度影响歌曲氛围。慢速（60-80 BPM）适合抒情，中速（100-120 BPM）适合流行，快速（130+ BPM）适合舞曲。" },
    { title: "前奏设计", content: "前奏应引人入胜，奠定歌曲基调。可以是主旋律的简化版，也可以是独特的音色展示。" },
    { title: "间奏安排", content: "间奏可用于过渡或展示乐器技巧，但避免过长导致乏味。通常8-16小节就足够了。" },
    { title: "尾奏处理", content: "尾奏应与整首歌曲风格一致，给听众留下深刻印象。可以是渐弱，也可以是强有力的结束。" },
    { title: "和声编写", content: "和声应支持主旋律，避免喧宾夺主。使用三和弦和七和弦，适当加入延伸音增加色彩。" },
    { title: "旋律线条", content: "旋律应具有起伏，避免单调。使用音程跳跃和级进结合，创造有张力的旋律线。" },
    { title: "重复与变化", content: "重复可强化主题，但需注意变化，避免单调。每次重复可以改变配器、和声或节奏。" },
    { title: "对比手法", content: "通过对比增强歌曲层次：强弱对比、快慢对比、稀疏密集对比。主歌和副歌应该有明显区别。" },
    { title: "调式转换", content: "适时的调式转换可带来新鲜感，但需谨慎使用。关系大小调转换最常见，也最容易接受。" },
    { title: "转调技巧", content: "转调可以增加情感张力。向上转调（升半音或全音）通常带来能量提升，适合副歌。" },
    { title: "节奏型设计", content: "不同的节奏型会给音乐带来不同的感觉。尝试多种节奏组合，找到最适合歌曲风格的。" },
    { title: "低音线设计", content: "贝斯线应与鼓组紧密配合，提供低频支撑。可以是根音跟随，也可以是旋律性低音线。" },
    { title: "鼓组编写", content: "鼓组节奏应稳固，支撑整个编曲。底鼓和军鼓的配合是基础，镲片增加节奏感。" },
    { title: "吉他编配", content: "吉他可用于和声填充或旋律装饰。节奏吉他提供和声基础，主音吉他提供旋律线条。" },
    { title: "键盘使用", content: "键盘可提供和声基础或旋律点缀。钢琴适合和声，合成器适合音色和氛围。" },
    { title: "弦乐编写", content: "弦乐可增加厚度和情感，但需避免过度堆砌。使用弦乐组时注意声部安排，避免混乱。" },
    { title: "管乐安排", content: "管乐可提供明亮色彩，需注意与其他乐器的平衡。小号、萨克斯等可以增加爵士或流行感。" },
    { title: "人声编排", content: "主唱与和声的配合应和谐，避免冲突。和声通常比主唱低3-6度，创造层次感。" },
    { title: "音域安排", content: "避免乐器音域重叠，确保各部分清晰可辨。为每个乐器分配独特的音域空间。" },
    { title: "动态控制", content: "通过音量变化增加音乐的层次感和情感表达。主歌可以轻柔，副歌可以强烈。" },
    { title: "装饰音使用", content: "适当的装饰音可丰富旋律，但避免过度。滑音、颤音、装饰音可以增加表现力。" },
    { title: "音效运用", content: "适当的音效可增加氛围，但避免喧宾夺主。环境音、采样音效可以增加真实感。" },
    { title: "电子元素", content: "在流行音乐中，电子元素可增加现代感。合成器、电子鼓、效果器可以创造独特音色。" },
    { title: "采样使用", content: "使用采样需注意版权问题，并确保与歌曲风格匹配。可以采样自己的录音，或使用免版税采样库。" },
    { title: "编曲结构", content: "常见结构包括前奏、主歌、预副歌、副歌、桥段、尾奏。合理安排使歌曲更具吸引力。" },
    
    // 音色设计 (61-90)
    { title: "合成器基础", content: "了解振荡器、滤波器、包络、LFO的基本原理。振荡器产生波形，滤波器改变音色，包络控制动态，LFO创造运动。" },
    { title: "滤波器类型", content: "低通滤波器让高频通过，高通滤波器让低频通过，带通滤波器只让特定频段通过。每种都有不同的音色特点。" },
    { title: "包络发生器", content: "ADSR包络控制音色的起音、衰减、延音、释音。快起音适合打击乐，慢起音适合弦乐。" },
    { title: "LFO应用", content: "LFO（低频振荡器）可以调制各种参数，创造颤音、颤音、自动滤波等效果。速度通常设为1-10Hz。" },
    { title: "波形选择", content: "正弦波纯净，方波明亮，锯齿波丰富，三角波柔和。不同波形适合不同的音乐风格。" },
    { title: "失谐效果", content: "轻微失谐多个振荡器可以增加厚度和宽度。失谐2-5音分可以创造合唱效果。" },
    { title: "滤波器包络", content: "使用包络调制滤波器可以创造动态音色。从明亮到暗淡，或从暗淡到明亮，增加表现力。" },
    { title: "音色分层", content: "将多个音色层叠可以创造更丰富的声音。每层可以有不同的音色、音量和效果。" },
    { title: "采样器使用", content: "采样器可以播放真实乐器的录音。使用多采样可以增加真实感，不同力度触发不同采样。" },
    { title: "效果链顺序", content: "效果器顺序很重要：EQ→压缩→失真→调制→延迟→混响。但也可以打破规则，创造独特效果。" },
    { title: "失真类型", content: "软失真增加温暖感，硬失真增加攻击性。适度使用可以增加音色的个性和能量。" },
    { title: "合唱效果", content: "合唱效果通过轻微延迟和音高调制创造宽度。适合吉他、键盘和合成器，增加空间感。" },
    { title: "镶边效果", content: "镶边（Flanger）通过短延迟和反馈创造'嗖嗖'声。适合节奏元素，增加动感。" },
    { title: "移相效果", content: "移相（Phaser）通过相位移动创造扫频效果。适合键盘和吉他，增加迷幻感。" },
    { title: "音高修正", content: "音高修正工具可以修正音准，但要适度使用。过度修正会让声音不自然，失去人性化。" },
    { title: "时间拉伸", content: "时间拉伸可以改变音频长度而不改变音高，或改变音高而不改变长度。但要小心音质损失。" },
    { title: "反向音频", content: "反向音频可以创造独特效果。反向混响、反向延迟可以增加神秘感。" },
    { title: "音色自动化", content: "自动化滤波器、LFO、效果器参数可以创造动态音色。让音色在歌曲中不断变化。" },
    { title: "共振峰", content: "共振峰是音色的特征频率。使用共振峰滤波器可以模拟不同乐器的音色特点。" },
    { title: "FM合成", content: "FM合成通过频率调制创造复杂音色。可以产生从纯净到尖锐的各种音色。" },
    { title: "减法合成", content: "减法合成从丰富波形开始，通过滤波去除不需要的频率。这是最常用的合成方法。" },
    { title: "加法合成", content: "加法合成通过叠加多个正弦波创造音色。可以精确控制每个谐波，但计算量大。" },
    { title: "波表合成", content: "波表合成使用预定义的波形表，通过扫描创造动态音色。适合创造不断变化的音色。" },
    { title: "颗粒合成", content: "颗粒合成将音频分成小颗粒，重新组合创造新音色。可以创造独特的声音纹理。" },
    { title: "物理建模", content: "物理建模模拟真实乐器的物理特性。可以创造非常真实的音色，但计算复杂。" },
    { title: "采样合成", content: "采样合成结合采样和合成技术。使用真实采样作为起点，通过合成技术修改。" },
    { title: "音色预设", content: "使用音色预设可以快速开始，但不要完全依赖。修改预设可以创造独特的音色。" },
    { title: "音色对比", content: "在编曲中使用对比音色可以增加趣味性。明亮与暗淡，温暖与冰冷，创造张力。" },
    { title: "音色进化", content: "让音色在歌曲中进化。从简单开始，逐渐增加复杂性，创造动态感。" },
    { title: "环境音色", content: "环境音色可以增加氛围感。使用长混响、延迟、音色垫可以创造空间感。" },
    
    // 和声理论 (91-120)
    { title: "三和弦", content: "大三和弦明亮，小三和弦柔和，减三和弦紧张，增三和弦神秘。了解每种和弦的情感色彩。" },
    { title: "七和弦", content: "大七和弦爵士感，小七和弦柔和，属七和弦需要解决，半减七和弦复杂。七和弦增加和声色彩。" },
    { title: "延伸音", content: "九音、十一音、十三音可以增加和声复杂性。但要小心使用，避免过度复杂。" },
    { title: "转位和弦", content: "转位和弦改变低音，创造不同的和声感觉。第一转位、第二转位各有特点。" },
    { title: "和声功能", content: "主和弦稳定，属和弦需要解决，下属和弦过渡。了解功能可以创造流畅的和声进行。" },
    { title: "调性中心", content: "明确调性中心可以让音乐有方向感。主音是'家'，其他和弦都指向它。" },
    { title: "和声节奏", content: "和声变化的频率影响音乐感觉。快速变化增加紧张感，慢速变化更稳定。" },
    { title: "和声密度", content: "和声密度指同时发声的音符数量。稀疏和声更开放，密集和声更丰富。" },
    { title: "声部进行", content: "声部进行要流畅，避免大跳。平行进行要小心，避免平行五度和平行八度。" },
    { title: "对位法", content: "对位法让多个旋律线独立又和谐。适合复调音乐，增加复杂性。" },
    { title: "和声替换", content: "和声替换用相关和弦替代原和弦，增加色彩。如用IIm替代IV，用bIIIm替代V。" },
    { title: "调式互换", content: "从关系大小调借用和弦可以增加色彩。如大调中使用小调和弦，或反之。" },
    { title: "副属和弦", content: "副属和弦是其他调的属和弦，创造临时转调感。增加和声的复杂性和色彩。" },
    { title: "经过和弦", content: "经过和弦连接两个主要和弦，创造流畅过渡。可以是经过音形成的和弦。" },
    { title: "挂留和弦", content: "挂留和弦延迟解决，增加紧张感。挂二和弦、挂四和弦各有特点。" },
    { title: "加音和弦", content: "加音和弦在基础和弦上添加音程。加二度、加四度、加六度可以增加色彩。" },
    { title: "省略音", content: "省略和弦中的某些音可以创造不同感觉。省略三度创造开放感，省略五度增加不稳定性。" },
    { title: "和声外音", content: "和声外音不属于和弦，但增加旋律性。经过音、辅助音、先现音、延留音各有特点。" },
    { title: "和声分析", content: "分析经典歌曲的和声进行，学习成功的模式。但不要完全模仿，要在此基础上创新。" },
    { title: "和声创新", content: "打破传统和声规则可以创造独特感。但要理解规则，才能有效打破。" },
    { title: "调式音阶", content: "不同调式有不同的情感色彩。大调明亮，小调柔和，多利亚调式神秘，混合利底亚调式爵士感。" },
    { title: "五声音阶", content: "五声音阶只有五个音，避免不和谐音程。适合即兴和旋律创作，容易上手。" },
    { title: "蓝调音阶", content: "蓝调音阶加入降三、降五、降七音，创造蓝调感。适合布鲁斯、摇滚、爵士。" },
    { title: "全音阶", content: "全音阶每个音之间都是全音，创造神秘感。适合印象派音乐，增加不稳定性。" },
    { title: "半音阶", content: "半音阶包含所有12个音，创造紧张感。适合现代音乐，增加复杂性。" },
    { title: "和声小调", content: "和声小调升高七度，创造导音。增加向主音的倾向性，适合古典音乐。" },
    { title: "旋律小调", content: "旋律小调上行升高六、七度，下行还原。创造流畅的旋律线。" },
    { title: "调式混合", content: "在同一首歌曲中混合不同调式可以增加色彩。但要确保过渡自然。" },
    { title: "和声张力", content: "和声张力来自不协和音程。适度张力增加趣味性，过度张力可能不悦耳。" },
    { title: "和声解决", content: "不协和和弦需要解决到协和和弦。属七到主是最常见的解决，创造满足感。" },
    
    // 节奏与节拍 (121-150)
    { title: "节拍类型", content: "4/4拍最常见，适合大多数风格。3/4拍适合华尔兹，6/8拍适合抒情，5/4拍创造不规则感。" },
    { title: "切分音", content: "切分音打破常规重音，创造节奏感。适合爵士、拉丁、放克音乐。" },
    { title: "三连音", content: "三连音将一拍分成三等分，创造流畅感。适合爵士、蓝调、摇滚。" },
    { title: "复节奏", content: "复节奏同时使用不同的节奏型，创造复杂性。如3对2，4对3等。" },
    { title: "节奏密度", content: "节奏密度指单位时间内的音符数量。稀疏创造空间感，密集增加能量。" },
    { title: "重音位置", content: "改变重音位置可以创造不同感觉。反拍重音创造律动感，弱拍重音增加复杂性。" },
    { title: "休止符", content: "休止符和音符同样重要。适当的休止可以增加节奏感和空间感。" },
    { title: "节奏变化", content: "在歌曲中改变节奏可以增加趣味性。主歌和副歌可以有不同的节奏密度。" },
    { title: "节奏型重复", content: "重复节奏型可以创造律动感，但要适当变化，避免单调。" },
    { title: "节奏层次", content: "不同乐器可以演奏不同的节奏型，创造层次感。底鼓、军鼓、镲片各有节奏。" },
    { title: "节奏同步", content: "确保所有节奏元素同步。使用节拍器或量化功能，但也要保留人性化。" },
    { title: "节奏量化", content: "量化可以让节奏更精确，但过度量化会失去人性化。适度量化，保留轻微不完美。" },
    { title: "摇摆感", content: "摇摆感来自轻微的时间偏移。三连音的第二、三个音可以稍微延迟，创造摇摆。" },
    { title: "节奏填充", content: "节奏填充在段落之间增加趣味性。可以是鼓的填充，也可以是其他乐器的装饰。" },
    { title: "节奏简化", content: "有时简化节奏比复杂更好。简单的节奏更容易让人记住和跟随。" },
    { title: "节奏对比", content: "通过节奏对比创造张力。快慢对比、稀疏密集对比可以增加趣味性。" },
    { title: "节奏动机", content: "节奏动机是短小的节奏模式，可以重复和发展。创造统一感和记忆点。" },
    { title: "节奏变奏", content: "在重复的基础上变化节奏，保持新鲜感。可以改变重音、密度、或节奏型。" },
    { title: "节奏对话", content: "不同乐器之间的节奏对话可以增加趣味性。一问一答，创造互动感。" },
    { title: "节奏张力", content: "通过节奏创造张力。加速、减速、切分、休止都可以增加紧张感。" },
    { title: "节奏释放", content: "在紧张之后释放，创造满足感。复杂节奏后简化，快速后放慢。" },
    { title: "节奏记忆", content: "创造容易记住的节奏型。简单的重复模式更容易让听众跟随。" },
    { title: "节奏创新", content: "尝试不常见的节奏型。奇数拍、复节奏、不规则重音可以创造独特感。" },
    { title: "节奏平衡", content: "平衡复杂和简单。太复杂可能难以跟随，太简单可能单调。" },
    { title: "节奏发展", content: "让节奏在歌曲中发展。从简单开始，逐渐增加复杂性。" },
    { title: "节奏统一", content: "保持节奏的统一性。虽然可以变化，但要有共同的基础。" },
    { title: "节奏空间", content: "给节奏留出空间。不要每个拍子都填满，适当的休止增加呼吸感。" },
    { title: "节奏能量", content: "通过节奏控制能量。密集节奏增加能量，稀疏节奏降低能量。" },
    { title: "节奏情感", content: "不同节奏传达不同情感。快速节奏兴奋，慢速节奏平静，不规则节奏紧张。" },
    { title: "节奏技巧", content: "学习各种节奏技巧：切分、三连音、复节奏、摇摆、填充等。灵活运用。" },
    
    // 工作流程与技巧 (151-180)
    { title: "项目组织", content: "保持项目文件整洁。使用清晰的轨道命名，分组相关轨道，使用颜色标记。" },
    { title: "模板使用", content: "创建混音模板可以节省时间。预设常用效果器、路由、总线设置。" },
    { title: "版本控制", content: "定期保存项目版本。使用日期或版本号命名，方便回溯到之前的版本。" },
    { title: "备份习惯", content: "定期备份项目文件。使用云存储或外部硬盘，避免丢失工作。" },
    { title: "参考轨道", content: "在项目中加载参考轨道，方便对比。但要在混音前设置好电平，避免误导。" },
    { title: "监听音量", content: "混音时保持适中的监听音量。太大会疲劳耳朵，太小会错过细节。通常75-85dB SPL。" },
    { title: "休息间隔", content: "每工作45-60分钟休息10-15分钟。让耳朵恢复，避免疲劳导致的错误判断。" },
    { title: "新鲜耳朵", content: "第二天再听混音，用新鲜耳朵判断。可能会发现之前没注意到的问题。" },
    { title: "单声道检查", content: "经常切换到单声道检查。如果单声道听起来好，立体声通常也会好。" },
    { title: "不同设备", content: "在不同设备上测试：耳机、音箱、手机、汽车音响。确保在所有设备上都好听。" },
    { title: "频率扫频", content: "使用扫频EQ找到问题频率。提升一个窄频段，扫过整个频谱，找到需要处理的频率。" },
    { title: "静音技巧", content: "逐个静音轨道，找出问题所在。如果静音后混音更好，说明这个轨道有问题。" },
    { title: "独奏技巧", content: "独奏轨道检查，但不要只依赖独奏。在上下文中判断，因为独奏时听起来好的，在混音中可能不好。" },
    { title: "对比技巧", content: "经常对比处理前后。使用旁路功能，确保处理真的改善了声音。" },
    { title: "渐进处理", content: "渐进地应用处理，而不是一次性大幅调整。小幅度多次调整比大幅度一次调整更安全。" },
    { title: "预设起点", content: "使用预设作为起点，但要根据实际情况调整。没有万能的预设。" },
    { title: "学习分析", content: "分析你喜欢的歌曲。使用频谱分析、相位分析等工具，学习成功的混音技巧。" },
    { title: "实验精神", content: "不要害怕实验。尝试不同的效果器组合、参数设置，可能会发现新的声音。" },
    { title: "简化原则", content: "如果混音有问题，先尝试简化而不是添加。移除效果器，降低处理，可能就解决了。" },
    { title: "目标明确", content: "在开始混音前明确目标。想要什么风格？什么感觉？有了目标才能做出正确的决定。" },
    { title: "优先级", content: "优先处理最重要的元素。主唱、底鼓、贝斯通常是优先级最高的。" },
    { title: "整体思维", content: "始终从整体角度思考。单个元素可能听起来不错，但要在整体混音中判断。" },
    { title: "细节处理", content: "注意细节，但不要过度。微小的调整可以带来巨大改善，但过度处理会适得其反。" },
    { title: "时间管理", content: "合理分配时间。不要在一个元素上花费太多时间，保持整体进度。" },
    { title: "决策速度", content: "快速做出决定，不要过度纠结。通常第一直觉是对的，过度思考可能导致过度处理。" },
    { title: "完成比完美", content: "完成比完美更重要。不要为了追求完美而永远不完成。可以后续再改进。" },
    { title: "接受不完美", content: "接受不完美。没有完美的混音，只有合适的混音。适度的不完美可能更有魅力。" },
    { title: "持续学习", content: "持续学习新技术和技巧。音乐制作技术在不断发展，保持学习可以保持竞争力。" },
    { title: "实践最重要", content: "理论知识重要，但实践更重要。多制作、多混音，从经验中学习。" },
    { title: "找到风格", content: "找到自己的风格和声音。不要完全模仿别人，要有自己的特色。" },
    { title: "享受过程", content: "享受制作音乐的过程。如果过程不愉快，结果可能也不会好。保持热情和创造力。" }
];

// 初始化
let songs = loadSongs();
let currentEditingId = null;
let currentView = 'list'; // 'list' or 'gantt'
let currentTimelineView = 'timeline'; // 'timeline' or 'project'
let currentKnowledgeIndex = 0;

// 计时器相关
let timer = {
    songId: null,
    startTime: null,
    pausedTime: 0,
    isRunning: false,
    isPaused: false,
    interval: null
};

const TIMER_STORAGE_KEY = 'musicplan_timer';

// 加载歌曲数据
function loadSongs() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 加载计时器状态
function loadTimer() {
    const data = localStorage.getItem(TIMER_STORAGE_KEY);
    if (data) {
        const saved = JSON.parse(data);
        if (saved.isRunning) {
            // 恢复计时器
            const now = Date.now();
            
            if (saved.isPaused) {
                // 如果之前是暂停状态
                let pauseDuration = 0;
                if (saved.pauseStartTime) {
                    pauseDuration = now - saved.pauseStartTime;
                }
                timer = {
                    songId: saved.songId,
                    startTime: null,
                    pausedTime: (saved.pausedTime || 0) + pauseDuration,
                    isRunning: true,
                    isPaused: true,
                    interval: null
                };
            } else {
                // 如果之前是运行状态，计算从保存的开始时间到现在的时间，加到已暂停时间中
                let elapsed = 0;
                if (saved.startTime) {
                    elapsed = now - saved.startTime;
                }
                timer = {
                    songId: saved.songId,
                    startTime: now, // 重新开始计时
                    pausedTime: (saved.pausedTime || 0) + elapsed, // 将之前的时间加到已暂停时间中
                    isRunning: true,
                    isPaused: false,
                    interval: null
                };
            }
            
            startTimerDisplay(saved.songId);
        }
    }
}

// 保存歌曲数据
function saveSongs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

// 保存计时器状态
function saveTimer() {
    const toSave = {
        songId: timer.songId,
        startTime: timer.startTime,
        pausedTime: timer.pausedTime,
        isRunning: timer.isRunning,
        isPaused: timer.isPaused,
        pauseStartTime: timer.isPaused ? Date.now() : null
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(toSave));
}

// 导出数据
function exportData() {
    try {
        // 收集所有需要备份的数据
        const backupData = {
            version: '1.0',
            exportTime: new Date().toISOString(),
            data: {
                songs: localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : [],
                timer: localStorage.getItem(TIMER_STORAGE_KEY) ? JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY)) : null,
                timeConfig: localStorage.getItem(TIME_CONFIG_KEY) ? JSON.parse(localStorage.getItem(TIME_CONFIG_KEY)) : null,
                milestones: {}
            }
        };

        // 收集所有里程碑标记
        const milestoneKeys = ['milestone_1', 'milestone_3', 'milestone_5', 'milestone_7', 'milestone_9', 'progress_50'];
        milestoneKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                backupData.data.milestones[key] = value;
            }
        });

        // 保存开始日期
        const startDate = localStorage.getItem(START_DATE_KEY);
        if (startDate) {
            backupData.data.startDate = startDate;
        }

        // 创建 JSON 字符串
        const jsonString = JSON.stringify(backupData, null, 2);

        // 创建 Blob 对象
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // 生成文件名（格式：musicplan_backup_YYYYMMDD_HHMMSS.json）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const filename = `musicplan_backup_${year}${month}${day}_${hours}${minutes}${seconds}.json`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理 URL 对象
        URL.revokeObjectURL(url);

        // 显示成功提示
        alert('备份导出成功！文件已保存为：' + filename);
    } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败，请重试。');
    }
}

// 导入数据
function importData() {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);

                // 验证数据格式
                if (!backupData.data || typeof backupData.data !== 'object') {
                    throw new Error('无效的备份文件格式');
                }

                // 确认导入
                const confirmMessage = `确定要导入备份数据吗？\n\n这将覆盖当前的所有数据。\n\n导出时间：${backupData.exportTime || '未知'}`;
                if (!confirm(confirmMessage)) {
                    return;
                }

                // 恢复歌曲数据
                if (backupData.data.songs && Array.isArray(backupData.data.songs)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(backupData.data.songs));
                    songs = backupData.data.songs;
                }

                // 恢复计时器状态
                if (backupData.data.timer) {
                    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(backupData.data.timer));
                    // 重新加载计时器状态
                    loadTimer();
                } else {
                    localStorage.removeItem(TIMER_STORAGE_KEY);
                }

                // 恢复里程碑标记
                if (backupData.data.milestones && typeof backupData.data.milestones === 'object') {
                    Object.keys(backupData.data.milestones).forEach(key => {
                        localStorage.setItem(key, backupData.data.milestones[key]);
                    });
                }

                // 恢复开始日期
                if (backupData.data.startDate) {
                    localStorage.setItem(START_DATE_KEY, backupData.data.startDate);
                }
                
                // 恢复时间配置
                if (backupData.data.timeConfig) {
                    localStorage.setItem(TIME_CONFIG_KEY, JSON.stringify(backupData.data.timeConfig));
                }

                // 刷新页面显示
                renderSongs();
                renderTimeline();
                renderProjectView();
                renderGantt();
                renderDailyPlan();
                updateStats();

                // 显示成功提示
                alert('数据导入成功！');
            } catch (error) {
                console.error('导入数据失败:', error);
                alert('导入数据失败：' + error.message + '\n请确保文件格式正确。');
            }
        };

        reader.onerror = function() {
            alert('读取文件失败，请重试。');
        };

        reader.readAsText(file);
    };

    // 触发文件选择
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 计算歌曲进度
function calculateProgress(song) {
    const completedTasks = song.completedTasks || [];
    return (completedTasks.length / TASKS.length) * 100;
}

// 计算时间分配
function calculateTimeDistribution(estimatedHours) {
    const composition = estimatedHours * 0.7; // 编曲作曲 70%
    const mixing = estimatedHours * 0.3; // 混音母带 30%
    const dailyMakingTime = getDailyMakingTime();
    const daysAtRecommended = dailyMakingTime > 0 ? estimatedHours / dailyMakingTime : 0; // 按实际制作时间计算所需天数
    const daysAtMax = estimatedHours / MAX_HOURS_PER_DAY; // 按每天6小时计算所需天数
    return { composition, mixing, total: estimatedHours, daysAtRecommended, daysAtMax };
}

// 任务时长管理
function calculateTaskHours(estimatedHours, isNewGenre = false) {
    const taskHours = [];
    let remainingHours = estimatedHours;
    
    // 如果是新曲风，第一个任务有占比，否则为0
    const firstTaskRatio = isNewGenre ? TASK_TIME_RATIOS[0] : 0;
    
    // 计算其他任务的总占比
    const otherTasksRatio = TASK_TIME_RATIOS.slice(1).reduce((sum, ratio) => sum + ratio, 0);
    const totalRatio = firstTaskRatio + otherTasksRatio;
    
    TASK_TIME_RATIOS.forEach((ratio, index) => {
        if (index === 0 && !isNewGenre) {
            taskHours.push(0);
        } else {
            const hours = (ratio / totalRatio) * remainingHours;
            taskHours.push(Math.round(hours * 10) / 10); // 保留一位小数
        }
    });
    
    return taskHours;
}

// 更新任务时长
function updateTaskHours(song, taskIndex, newHours) {
    if (!song.taskHours) {
        song.taskHours = calculateTaskHours(song.estimatedHours, song.isNewGenre);
    }
    song.taskHours[taskIndex] = Math.max(0, newHours);
    // 重新计算总时长
    const total = song.taskHours.reduce((sum, h) => sum + h, 0);
    song.estimatedHours = total;
    return song;
}

// 生成每日任务分配计划
function generateDailyPlan(songs) {
    const timeConfig = getTimeConfig();
    const dailyMakingTime = getDailyMakingTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取进行中的歌曲（isActive为true或未设置，且未完成）
    const activeSongs = songs.filter(song => {
        const isActive = song.isActive !== false; // 默认为true
        const isCompleted = song.currentStage === '已完成';
        return isActive && !isCompleted;
    });
    
    if (activeSongs.length === 0) {
        return [];
    }
    
    // 为每首歌初始化任务时长（如果还没有）
    activeSongs.forEach(song => {
        if (!song.taskHours) {
            song.taskHours = calculateTaskHours(song.estimatedHours, song.isNewGenre);
        }
    });
    
    // 生成每日计划
    const dailyPlan = [];
    const startDate = getStartDate();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + TOTAL_DAYS);
    
    // 为每首歌创建任务队列
    const songQueues = activeSongs.map(song => {
        const completedTasks = song.completedTasks || [];
        const queue = [];
        
        song.taskHours.forEach((hours, taskIndex) => {
            if (!completedTasks.includes(taskIndex) && hours > 0) {
                queue.push({
                    songId: song.id,
                    songName: song.name,
                    taskIndex: taskIndex,
                    taskName: TASKS[taskIndex],
                    hours: hours,
                    remainingHours: hours,
                    isNewGenre: song.isNewGenre
                });
            }
        });
        
        return {
            songId: song.id,
            songName: song.name,
            queue: queue,
            currentTaskIndex: 0
        };
    });
    
    // 从今天开始分配任务
    let currentDate = new Date(today);
    if (currentDate < startDate) {
        currentDate = new Date(startDate);
    }
    
    // 分配任务到每一天
    while (currentDate <= endDate) {
        const dayPlan = {
            date: new Date(currentDate),
            learningTask: {
                type: 'learning',
                name: '学习时间',
                hours: timeConfig.dailyLearningHours,
                description: '听歌分析/学习技巧'
            },
            makingTasks: [],
            totalHours: timeConfig.dailyLearningHours
        };
        
        let remainingMakingTime = dailyMakingTime;
        
        // 为每首歌分配任务
        songQueues.forEach(songQueue => {
            if (songQueue.currentTaskIndex >= songQueue.queue.length) {
                return; // 这首歌的所有任务已完成
            }
            
            const currentTask = songQueue.queue[songQueue.currentTaskIndex];
            if (currentTask.remainingHours <= 0) {
                songQueue.currentTaskIndex++;
                return;
            }
            
            // 计算今天可以分配多少时间给这个任务
            const hoursToAllocate = Math.min(currentTask.remainingHours, remainingMakingTime);
            
            if (hoursToAllocate > 0) {
                dayPlan.makingTasks.push({
                    type: 'making',
                    songId: currentTask.songId,
                    songName: currentTask.songName,
                    taskIndex: currentTask.taskIndex,
                    taskName: currentTask.taskName,
                    hours: hoursToAllocate
                });
                
                currentTask.remainingHours -= hoursToAllocate;
                remainingMakingTime -= hoursToAllocate;
                dayPlan.totalHours += hoursToAllocate;
                
                // 如果这个任务完成了，移到下一个任务
                if (currentTask.remainingHours <= 0) {
                    songQueue.currentTaskIndex++;
                }
            }
        });
        
        dailyPlan.push(dayPlan);
        
        // 检查是否所有任务都已完成
        const allDone = songQueues.every(sq => sq.currentTaskIndex >= sq.queue.length);
        if (allDone) {
            break;
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dailyPlan;
}

// 更新统计信息
function updateStats() {
    const completed = songs.filter(s => s.currentStage === '已完成').length;
    const inProgress = songs.filter(s => s.currentStage !== '已完成' && s.currentStage !== '曲风研究').length;
    const totalProgress = songs.length > 0 
        ? (songs.reduce((sum, s) => sum + calculateProgress(s), 0) / songs.length).toFixed(1)
        : 0;

    document.getElementById('completedSongs').textContent = completed;
    document.getElementById('inProgressSongs').textContent = inProgress;
    document.getElementById('totalProgress').textContent = totalProgress + '%';
    document.getElementById('remainingDays').textContent = getRemainingDays();
}

// 渲染歌曲列表
function renderSongs() {
    const container = document.getElementById('songsList');
    container.innerHTML = '';

    if (songs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">还没有添加歌曲，点击上方按钮添加第一首歌吧！</p>';
        return;
    }

    songs.forEach(song => {
        const progress = calculateProgress(song);
        const timeDist = calculateTimeDistribution(song.estimatedHours);
        const remainingTime = timeDist.total - (song.timeSpent || 0);

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-header">
                <div>
                    <div class="song-title">
                        ${song.name || '未命名歌曲'}
                        ${song.isNewGenre ? '<span style="background: #ffc107; color: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">新曲风</span>' : ''}
                    </div>
                    ${song.genre ? `<div style="font-size: 0.9em; color: #666; margin-top: 4px;">${song.genre}</div>` : ''}
                </div>
                <span class="song-stage stage-${song.currentStage}">${song.currentStage}</span>
            </div>
            <div class="song-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>任务进度: ${song.completedTasks?.length || 0}/${TASKS.length}</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>
            </div>
            <div class="song-info">
                <div class="info-item">
                    <span class="info-label">预计时长</span>
                    <span class="info-value">${timeDist.total} 小时</span>
                </div>
                <div class="info-item">
                    <span class="info-label">已用时长</span>
                    <span class="info-value">${song.timeSpent || 0} 小时</span>
                </div>
                <div class="info-item">
                    <span class="info-label">剩余时长</span>
                    <span class="info-value">${remainingTime.toFixed(1)} 小时</span>
                </div>
            </div>
            ${song.isNewGenre ? `
            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px; font-size: 0.85em; color: #856404;">
                <strong>新曲风提示：</strong>需要至少一周前期准备（听10张专辑，搜索曲风介绍：BPM、配器音色、代表人物、经典曲目、最新曲目）
            </div>
            ` : ''}
            ${timeDist.daysAtRecommended ? `
            <div style="margin-top: 10px; padding: 10px; background: #d1ecf1; border-radius: 6px; font-size: 0.85em; color: #0c5460;">
                <strong>时间预估：</strong>每天2小时需${timeDist.daysAtRecommended.toFixed(0)}天，每天6小时需${timeDist.daysAtMax.toFixed(0)}天
            </div>
            ` : ''}
            <div class="timer-section" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                ${timer.songId === song.id && timer.isRunning 
                    ? `<div class="timer-active">
                        <span style="color: #667eea; font-weight: 600;">⏱️ 正在计时中...</span>
                        <button class="btn btn-small" onclick="stopTimer()" style="margin-left: 10px;">停止</button>
                       </div>`
                    : `<button class="btn btn-small ${timer.songId === song.id ? 'btn-secondary' : 'btn-primary'}" onclick="startTimer('${song.id}')">
                        ${timer.songId === song.id ? '继续计时' : '开始计时'}
                       </button>`
                }
            </div>
            <div class="song-actions">
                <button class="btn btn-small btn-edit" onclick="editSong('${song.id}')">编辑</button>
                <button class="btn btn-small btn-delete" onclick="deleteSong('${song.id}')">删除</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// 渲染时间线
function renderTimeline() {
    const container = document.getElementById('timeline');
    container.innerHTML = '';

    if (songs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">添加歌曲后，时间线规划将显示在这里</p>';
        return;
    }

    // 计算每首歌的平均时间
    const avgHoursPerSong = songs.length > 0
        ? songs.reduce((sum, s) => sum + s.estimatedHours, 0) / songs.length
        : HOURS_PER_SONG;

    // 计算总工作量和时间安排
    const totalHours = TARGET_SONGS * avgHoursPerSong;
    const daysAtRecommended = totalHours / RECOMMENDED_HOURS_PER_DAY;
    const daysAtMax = totalHours / MAX_HOURS_PER_DAY;
    
    const remainingDays = getRemainingDays();
    const startDate = getStartDate();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + TOTAL_DAYS);
    
    // 格式化日期显示
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.innerHTML = `
        <h3>📅 时间规划</h3>
        <p><strong>开始日期：</strong>${formatDate(startDate)}</p>
        <p><strong>结束日期：</strong>${formatDate(endDate)}</p>
        <p><strong>目标：</strong>${remainingDays} 天内完成 ${TARGET_SONGS} 首歌（共 ${TOTAL_DAYS} 天）</p>
        <p><strong>每首歌：</strong>${avgHoursPerSong.toFixed(0)} 有效小时</p>
        <p><strong>总工作量：</strong>${totalHours.toFixed(0)} 有效小时</p>
        <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <strong>时间安排：</strong><br>
            • 每天 ${RECOMMENDED_HOURS_PER_DAY} 小时（已养成习惯）：${daysAtRecommended.toFixed(0)} 天完成，约 ${(daysAtRecommended / avgHoursPerSong).toFixed(1)} 首歌/周<br>
            • 每天 ${MAX_HOURS_PER_DAY} 小时（最大强度）：${daysAtMax.toFixed(0)} 天完成，约 ${(daysAtMax / avgHoursPerSong).toFixed(1)} 首歌/周<br>
            <span style="color: #28a745; font-weight: 600;">✓ 维持每天2小时的习惯，${TOTAL_DAYS}天可以完成9首歌，一定能拿回全部押金！</span>
        </p>
        <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <strong>时间分配建议：</strong><br>
            • 编曲作曲：${(RECOMMENDED_HOURS_PER_DAY * 0.7).toFixed(1)} 小时/天 (70%)<br>
            • 混音母带：${(RECOMMENDED_HOURS_PER_DAY * 0.3).toFixed(1)} 小时/天 (30%)
        </p>
    `;
    container.appendChild(timelineItem);

    // 显示每首歌的预计完成时间
    const hoursPerDay = RECOMMENDED_HOURS_PER_DAY; // 使用推荐的工作时间
    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        const progress = calculateProgress(song);
        const remainingTime = song.estimatedHours - (song.timeSpent || 0);
        const estimatedDays = remainingTime / hoursPerDay;

        item.innerHTML = `
            <h3>${song.name || `歌曲 ${index + 1}`}</h3>
            <p><strong>阶段：</strong>${song.currentStage}</p>
            <p><strong>进度：</strong>${progress.toFixed(1)}%</p>
            <p><strong>预计还需：</strong>${estimatedDays.toFixed(1)} 天完成</p>
        `;
        container.appendChild(item);
    });
}

// 打开添加歌曲模态框
function openAddModal() {
    currentEditingId = null;
    const modal = document.getElementById('songModal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    document.getElementById('modalTitle').textContent = '添加新歌';
    const form = document.getElementById('songForm');
    if (form) {
        form.reset();
    }
    const songIdInput = document.getElementById('songId');
    if (songIdInput) {
        songIdInput.value = '';
    }
    
    // 重置任务复选框
    TASKS.forEach((_, index) => {
        const checkbox = document.getElementById(`task${index + 1}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
    
    // 重置新曲风复选框
    const isNewGenreCheckbox = document.getElementById('isNewGenre');
    if (isNewGenreCheckbox) {
        isNewGenreCheckbox.checked = false;
    }
    
    // 重置预计时长
    const estimatedHoursInput = document.getElementById('estimatedHours');
    if (estimatedHoursInput) {
        estimatedHoursInput.value = HOURS_PER_SONG;
    }
    
    // 隐藏任务时长编辑区域
    const taskHoursGroup = document.getElementById('taskHoursGroup');
    if (taskHoursGroup) {
        taskHoursGroup.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

// 更新任务时长显示
function updateTaskHoursDisplay() {
    const estimatedHours = parseFloat(document.getElementById('estimatedHours').value) || HOURS_PER_SONG;
    const isNewGenre = document.getElementById('isNewGenre').checked;
    const taskHours = calculateTaskHours(estimatedHours, isNewGenre);
    
    const taskHoursList = document.getElementById('taskHoursList');
    const taskHoursGroup = document.getElementById('taskHoursGroup');
    
    if (!taskHoursList || !taskHoursGroup) return;
    
    taskHoursList.innerHTML = '';
    
    taskHours.forEach((hours, index) => {
        // 如果是新曲风，第一个任务显示；如果不是新曲风，第一个任务隐藏
        if (index === 0 && !isNewGenre) {
            return;
        }
        
        const taskItem = document.createElement('div');
        taskItem.className = 'task-hour-item';
        taskItem.innerHTML = `
            <label class="task-hour-label">${TASKS[index]}</label>
            <div class="task-hour-controls">
                <button type="button" class="btn btn-small" onclick="adjustTaskHour(${index}, -0.5)">-0.5</button>
                <input type="number" class="task-hour-input" data-task-index="${index}" value="${hours.toFixed(1)}" min="0" step="0.5" onchange="recalculateTotalHours()">
                <button type="button" class="btn btn-small" onclick="adjustTaskHour(${index}, 0.5)">+0.5</button>
            </div>
        `;
        taskHoursList.appendChild(taskItem);
    });
    
    taskHoursGroup.style.display = 'block';
    recalculateTotalHours();
}

// 调整任务时长
function adjustTaskHour(taskIndex, delta) {
    const input = document.querySelector(`.task-hour-input[data-task-index="${taskIndex}"]`);
    if (input) {
        const currentValue = parseFloat(input.value) || 0;
        input.value = Math.max(0, currentValue + delta).toFixed(1);
        recalculateTotalHours();
    }
}

// 重新计算总时长
function recalculateTotalHours() {
    const inputs = document.querySelectorAll('.task-hour-input');
    let total = 0;
    inputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    const estimatedHoursInput = document.getElementById('estimatedHours');
    if (estimatedHoursInput) {
        estimatedHoursInput.value = Math.round(total * 10) / 10;
    }
}

// 编辑歌曲
function editSong(id) {
    const song = songs.find(s => s.id === id);
    if (!song) return;

    currentEditingId = id;
    document.getElementById('modalTitle').textContent = '编辑歌曲';
    document.getElementById('songId').value = song.id;
    document.getElementById('songName').value = song.name || '';
    document.getElementById('songGenre').value = song.genre || '';
    document.getElementById('estimatedHours').value = song.estimatedHours || HOURS_PER_SONG;
    document.getElementById('currentStage').value = song.currentStage || '曲风研究';
    document.getElementById('timeSpent').value = song.timeSpent || 0;
    document.getElementById('notes').value = song.notes || '';
    document.getElementById('isNewGenre').checked = song.isNewGenre || false;

    // 设置任务复选框
    TASKS.forEach((_, index) => {
        const checkbox = document.getElementById(`task${index + 1}`);
        if (checkbox) {
            checkbox.checked = song.completedTasks?.includes(index) || false;
        }
    });
    
    // 显示任务时长
    updateTaskHoursDisplay();
    
    // 如果有保存的任务时长，使用保存的值
    if (song.taskHours && song.taskHours.length > 0) {
        const taskHoursList = document.getElementById('taskHoursList');
        if (taskHoursList) {
            const inputs = taskHoursList.querySelectorAll('.task-hour-input');
            inputs.forEach((input, index) => {
                const taskIndex = parseInt(input.getAttribute('data-task-index'));
                if (song.taskHours[taskIndex] !== undefined) {
                    input.value = song.taskHours[taskIndex].toFixed(1);
                }
            });
            recalculateTotalHours();
        }
    }

    const modal = document.getElementById('songModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 删除歌曲
function deleteSong(id) {
    if (confirm('确定要删除这首歌吗？')) {
        songs = songs.filter(s => s.id !== id);
        saveSongs();
        renderSongs();
        renderTimeline();
        renderProjectView();
        renderGantt();
        renderDailyPlan();
        updateStats();
    }
}

// 保存歌曲
function saveSong(event) {
    event.preventDefault();

    const id = document.getElementById('songId').value || generateId();
    const name = document.getElementById('songName').value;
    const genre = document.getElementById('songGenre').value;
    let estimatedHours = parseFloat(document.getElementById('estimatedHours').value) || HOURS_PER_SONG;
    const currentStage = document.getElementById('currentStage').value;
    const timeSpent = parseFloat(document.getElementById('timeSpent').value) || 0;
    const notes = document.getElementById('notes').value;
    const isNewGenre = document.getElementById('isNewGenre').checked;

    // 收集已完成的任务
    const completedTasks = [];
    TASKS.forEach((_, index) => {
        if (document.getElementById(`task${index + 1}`).checked) {
            completedTasks.push(index);
        }
    });

    // 获取或计算任务时长
    let taskHours = null;
    if (currentEditingId) {
        const existingSong = songs.find(s => s.id === currentEditingId);
        if (existingSong && existingSong.taskHours) {
            taskHours = existingSong.taskHours;
        }
    }
    
    // 如果没有任务时长，自动计算
    if (!taskHours) {
        taskHours = calculateTaskHours(estimatedHours, isNewGenre);
    }
    
    // 获取任务时长输入（如果存在）
    const taskHoursInputs = document.querySelectorAll('.task-hour-input');
    if (taskHoursInputs.length > 0) {
        // 初始化任务时长数组
        taskHours = new Array(TASKS.length).fill(0);
        taskHoursInputs.forEach((input) => {
            const taskIndex = parseInt(input.getAttribute('data-task-index'));
            const hours = parseFloat(input.value) || 0;
            if (taskIndex >= 0 && taskIndex < TASKS.length) {
                taskHours[taskIndex] = hours;
            }
        });
        // 重新计算总时长
        const total = taskHours.reduce((sum, h) => sum + h, 0);
        if (total > 0) {
            estimatedHours = total;
        }
    }

    const songData = {
        id,
        name,
        genre,
        estimatedHours,
        currentStage,
        timeSpent,
        notes,
        completedTasks,
        isNewGenre,
        taskHours: taskHours,
        isActive: true, // 默认激活
        updatedAt: new Date().toISOString()
    };

    if (currentEditingId) {
        // 更新现有歌曲
        const index = songs.findIndex(s => s.id === currentEditingId);
        if (index !== -1) {
            songs[index] = { ...songs[index], ...songData };
        }
    } else {
        // 添加新歌曲
        songData.createdAt = new Date().toISOString();
        songs.push(songData);
    }

    saveSongs();
    renderSongs();
    renderTimeline();
    renderProjectView();
    renderGantt();
    renderDailyPlan(); // 渲染每日任务视图
    updateStats();
    checkAndShowEncouragement();
    closeModal();
}

// 关闭模态框
function closeModal() {
    document.getElementById('songModal').style.display = 'none';
    currentEditingId = null;
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 添加歌曲按钮
    const addSongBtn = document.getElementById('addSongBtn');
    if (addSongBtn) {
        addSongBtn.addEventListener('click', openAddModal);
    } else {
        console.error('Add song button not found');
    }

    // 表单提交
    document.getElementById('songForm').addEventListener('submit', saveSong);

    // 取消按钮
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    // 关闭按钮
    document.querySelector('.close').addEventListener('click', closeModal);

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        const songModal = document.getElementById('songModal');
        if (event.target === songModal) {
            closeModal();
        }
        const startDateModal = document.getElementById('startDateModal');
        if (event.target === startDateModal) {
            closeStartDateModal();
        }
    });

    // 加载计时器状态
    loadTimer();

    // 初始渲染
    renderSongs();
    renderTimeline();
    renderProjectView();
    renderGantt();
    renderDailyPlan();
    updateStats();
    initKnowledge();

    // 页面可见性变化时更新计时器
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && timer.isRunning) {
            updateTimerDisplay();
        }
    });
});

// 计时器功能
function startTimer(songId) {
    // 如果已有计时器在运行，先停止它
    if (timer.isRunning && timer.songId !== songId) {
        stopTimer();
    }

    const song = songs.find(s => s.id === songId);
    if (!song) return;

    if (timer.songId === songId && timer.isPaused) {
        // 恢复暂停的计时器
        resumeTimer();
        return;
    }

    // 开始新的计时器
    timer.songId = songId;
    timer.startTime = Date.now();
    timer.pausedTime = 0;
    timer.isRunning = true;
    timer.isPaused = false;

    startTimerDisplay(songId);
    saveTimer();
    renderSongs();
    renderGantt();
}

function startTimerDisplay(songId) {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    document.getElementById('timerSongName').textContent = song.name || '未命名歌曲';
    document.getElementById('timerFloating').style.display = 'block';

    // 清除之前的interval
    if (timer.interval) {
        clearInterval(timer.interval);
    }

    // 更新按钮状态
    if (timer.isPaused) {
        document.getElementById('timerPauseBtn').style.display = 'none';
        document.getElementById('timerResumeBtn').style.display = 'inline-block';
    } else {
        document.getElementById('timerPauseBtn').style.display = 'inline-block';
        document.getElementById('timerResumeBtn').style.display = 'none';
    }

    // 更新显示
    updateTimerDisplay();

    // 每秒更新一次
    timer.interval = setInterval(() => {
        if (!timer.isPaused) {
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (!timer.isRunning) return;

    const now = Date.now();
    let elapsed = 0;

    if (timer.isPaused) {
        elapsed = timer.pausedTime;
    } else {
        // 如果正在运行，计算从当前开始时间到现在的时间，加上之前已暂停的时间
        if (timer.startTime) {
            elapsed = (now - timer.startTime) + timer.pausedTime;
        } else {
            elapsed = timer.pausedTime;
        }
    }

    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = timeString;
}

function pauseTimer() {
    if (!timer.isRunning || timer.isPaused) return;

    const now = Date.now();
    if (timer.startTime) {
        timer.pausedTime += now - timer.startTime;
    }
    timer.isPaused = true;
    timer.startTime = null;

    document.getElementById('timerPauseBtn').style.display = 'none';
    document.getElementById('timerResumeBtn').style.display = 'inline-block';

    saveTimer();
    renderSongs();
}

function resumeTimer() {
    if (!timer.isRunning || !timer.isPaused) return;

    timer.isPaused = false;
    timer.startTime = Date.now();

    document.getElementById('timerPauseBtn').style.display = 'inline-block';
    document.getElementById('timerResumeBtn').style.display = 'none';

    saveTimer();
    renderSongs();
}

function stopTimer() {
    if (!timer.isRunning) return;

    // 计算总时长（小时）
    let totalElapsed = timer.pausedTime;
    if (!timer.isPaused && timer.startTime) {
        totalElapsed += Date.now() - timer.startTime;
    }
    const hours = totalElapsed / 3600000;

    // 更新歌曲的已用时长
    const song = songs.find(s => s.id === timer.songId);
    if (song) {
        song.timeSpent = (song.timeSpent || 0) + hours;
        saveSongs();
    }

    // 清除计时器
    if (timer.interval) {
        clearInterval(timer.interval);
    }

    timer = {
        songId: null,
        startTime: null,
        pausedTime: 0,
        isRunning: false,
        isPaused: false,
        interval: null
    };

    localStorage.removeItem(TIMER_STORAGE_KEY);
    document.getElementById('timerFloating').style.display = 'none';
    renderSongs();
    renderTimeline();
    renderProjectView();
    renderGantt();
    renderDailyPlan();
    updateStats();
    checkAndShowEncouragement();
}

// 甘特图视图切换（现在甘特图是独立区域，这个函数可以简化或移除）
function switchGanttView(view) {
    // 甘特图现在是独立区域，始终显示
    renderGantt();
}

// 渲染甘特图（按日展示）
function renderGantt() {
    const container = document.getElementById('ganttChart');
    container.innerHTML = '';

    if (songs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">还没有添加歌曲，点击上方按钮添加第一首歌吧！</p>';
        return;
    }

    // 计算日期范围（从开始日期到结束日期）
    const startDate = getStartDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + TOTAL_DAYS);
    const remainingDays = getRemainingDays();

    // 计算每首歌的平均时间
    const avgHoursPerSong = songs.length > 0
        ? songs.reduce((sum, s) => sum + s.estimatedHours, 0) / songs.length
        : HOURS_PER_SONG;
    // 使用推荐的工作时间（每天2小时）来计算
    const hoursPerDay = RECOMMENDED_HOURS_PER_DAY;

    // 创建甘特图容器
    const ganttWrapper = document.createElement('div');
    ganttWrapper.className = 'gantt-wrapper';

    // 创建时间轴（按周显示，每周显示日期）
    const timeline = document.createElement('div');
    timeline.className = 'gantt-timeline';
    
    // 生成所有日期（从开始日期到结束日期）
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 创建日期表头（每7天显示一次，或每周的第一天）
    const timelineHeader = document.createElement('div');
    timelineHeader.className = 'gantt-timeline-header';
    
    // 按周分组显示
    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
        weeks.push(dates.slice(i, i + 7));
    }

    weeks.forEach((week, weekIndex) => {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'gantt-week';
        const firstDay = week[0];
        const lastDay = week[week.length - 1];
        weekDiv.innerHTML = `
            <div class="gantt-week-label">${firstDay.getMonth() + 1}/${firstDay.getDate()}</div>
            <div class="gantt-week-days">
                ${week.map(day => {
                    const isToday = day.getTime() === today.getTime();
                    const isStartDate = day.getTime() === startDate.getTime();
                    return `<div class="gantt-day ${isToday ? 'today' : ''} ${isStartDate ? 'start-date' : ''}">${day.getDate()}</div>`;
                }).join('')}
            </div>
        `;
        timelineHeader.appendChild(weekDiv);
    });
    timeline.appendChild(timelineHeader);

    // 添加歌曲行
    songs.forEach((song, index) => {
        const progress = calculateProgress(song);
        const remainingTime = song.estimatedHours - (song.timeSpent || 0);
        const estimatedDays = Math.max(1, remainingTime / hoursPerDay);
        
        // 计算开始和结束日期
        const startOffset = index * (TOTAL_DAYS / TARGET_SONGS);
        const songStartDate = new Date(startDate);
        songStartDate.setDate(startDate.getDate() + Math.floor(startOffset));
        
        const endDateForSong = new Date(songStartDate);
        endDateForSong.setDate(songStartDate.getDate() + Math.ceil(estimatedDays));

        const row = document.createElement('div');
        row.className = 'gantt-row';
        
        const songLabel = document.createElement('div');
        songLabel.className = 'gantt-song-label';
        const newGenreBadge = song.isNewGenre ? '<span style="background: #ffc107; color: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">新曲风</span>' : '';
        songLabel.innerHTML = `
            <div class="gantt-song-name">${song.name || `歌曲 ${index + 1}`}${newGenreBadge}</div>
            <div class="gantt-song-info">${progress.toFixed(0)}% | ${(song.timeSpent || 0).toFixed(1)}h / ${song.estimatedHours}h</div>
            <div class="gantt-song-stage">${song.currentStage}</div>
        `;
        row.appendChild(songLabel);

        const songBar = document.createElement('div');
        songBar.className = 'gantt-song-bar-container';
        
        // 计算进度条位置和宽度（按天数）
        const daysFromStart = Math.floor((songStartDate - startDate) / (1000 * 60 * 60 * 24));
        const dayWidth = 100 / dates.length;
        const startPercent = daysFromStart * dayWidth;
        const widthPercent = estimatedDays * dayWidth;
        const progressPercent = (song.timeSpent || 0) / song.estimatedHours * 100;

        const bar = document.createElement('div');
        bar.className = 'gantt-song-bar';
        bar.style.left = `${Math.max(0, startPercent)}%`;
        bar.style.width = `${Math.min(widthPercent, 100 - startPercent)}%`;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'gantt-song-progress';
        progressBar.style.width = `${Math.min(progressPercent, 100)}%`;
        progressBar.style.backgroundColor = song.currentStage === '已完成' ? '#28a745' : '#667eea';
        
        bar.appendChild(progressBar);
        songBar.appendChild(bar);
        row.appendChild(songBar);

        timeline.appendChild(row);
    });

    ganttWrapper.appendChild(timeline);
    container.appendChild(ganttWrapper);
}

// 渲染项目进度视图
function renderProjectView() {
    const container = document.getElementById('projectView');
    container.innerHTML = '';

    if (songs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">还没有添加歌曲</p>';
        return;
    }

    // 计算项目整体进度
    const totalProgress = songs.reduce((sum, s) => sum + calculateProgress(s), 0) / songs.length;
    const completedSongs = songs.filter(s => s.currentStage === '已完成').length;
    const inProgressSongs = songs.filter(s => s.currentStage !== '已完成' && s.currentStage !== '曲风研究').length;
    
    // 计算时间进度
    const totalEstimatedHours = songs.reduce((sum, s) => sum + s.estimatedHours, 0);
    const totalSpentHours = songs.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const timeProgress = (totalSpentHours / totalEstimatedHours) * 100;

    // 计算里程碑
    const milestones = [
        { name: '第一首歌完成', progress: 11.1, achieved: completedSongs >= 1 },
        { name: '25%完成', progress: 25, achieved: completedSongs >= 3 },
        { name: '一半完成', progress: 50, achieved: completedSongs >= 5 },
        { name: '75%完成', progress: 75, achieved: completedSongs >= 7 },
        { name: '全部完成', progress: 100, achieved: completedSongs >= 9 }
    ];

    const projectView = document.createElement('div');
    projectView.className = 'project-view-content';
    
    // 整体进度卡片
    const overviewCard = document.createElement('div');
    overviewCard.className = 'project-card';
    overviewCard.innerHTML = `
        <h3>📊 项目概览</h3>
        <div class="project-stats-grid">
            <div class="project-stat">
                <div class="project-stat-label">整体进度</div>
                <div class="project-stat-value">${totalProgress.toFixed(1)}%</div>
                <div class="project-progress-bar">
                    <div class="project-progress-fill" style="width: ${totalProgress}%"></div>
                </div>
            </div>
            <div class="project-stat">
                <div class="project-stat-label">已完成歌曲</div>
                <div class="project-stat-value">${completedSongs} / ${TARGET_SONGS}</div>
            </div>
            <div class="project-stat">
                <div class="project-stat-label">进行中</div>
                <div class="project-stat-value">${inProgressSongs} 首</div>
            </div>
            <div class="project-stat">
                <div class="project-stat-label">时间进度</div>
                <div class="project-stat-value">${timeProgress.toFixed(1)}%</div>
                <div class="project-stat-sublabel">${totalSpentHours.toFixed(1)}h / ${totalEstimatedHours.toFixed(1)}h</div>
            </div>
        </div>
    `;
    projectView.appendChild(overviewCard);

    // 里程碑卡片
    const milestoneCard = document.createElement('div');
    milestoneCard.className = 'project-card';
    milestoneCard.innerHTML = `
        <h3>🎯 里程碑</h3>
        <div class="milestones">
            ${milestones.map(m => `
                <div class="milestone ${m.achieved ? 'achieved' : ''}">
                    <div class="milestone-icon">${m.achieved ? '✅' : '⏳'}</div>
                    <div class="milestone-info">
                        <div class="milestone-name">${m.name}</div>
                        <div class="milestone-progress">${m.progress}%</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    projectView.appendChild(milestoneCard);

    // 歌曲状态卡片
    const songsCard = document.createElement('div');
    songsCard.className = 'project-card';
    songsCard.innerHTML = `
        <h3>🎵 歌曲状态分布</h3>
        <div class="stage-distribution">
            ${STAGES.map(stage => {
                const count = songs.filter(s => s.currentStage === stage).length;
                const percent = (count / songs.length) * 100;
                return `
                    <div class="stage-item">
                        <div class="stage-name">${stage}</div>
                        <div class="stage-bar">
                            <div class="stage-bar-fill" style="width: ${percent}%"></div>
                        </div>
                        <div class="stage-count">${count} 首</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    projectView.appendChild(songsCard);

    container.appendChild(projectView);
}

// 渲染每日任务日历视图
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function renderDailyPlan() {
    const container = document.getElementById('dailyPlanView');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (songs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">还没有添加歌曲，点击上方按钮添加第一首歌吧！</p>';
        return;
    }
    
    // 生成每日计划
    const dailyPlan = generateDailyPlan(songs);
    
    if (dailyPlan.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">没有进行中的歌曲</p>';
        return;
    }
    
    // 创建日历容器
    const calendarWrapper = document.createElement('div');
    calendarWrapper.className = 'calendar-wrapper';
    
    // 创建月份导航
    const monthNav = document.createElement('div');
    monthNav.className = 'calendar-month-nav';
    monthNav.innerHTML = `
        <button class="btn btn-small" onclick="changeCalendarMonth(-1)">← 上个月</button>
        <h3>${currentCalendarYear}年 ${currentCalendarMonth + 1}月</h3>
        <button class="btn btn-small" onclick="changeCalendarMonth(1)">下个月 →</button>
    `;
    calendarWrapper.appendChild(monthNav);
    
    // 创建日历网格
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取第一天是星期几（0=周日，1=周一...）
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 创建星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-weekday';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // 填充空白（月初）
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // 创建每一天
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentCalendarYear, currentCalendarMonth, day);
        date.setHours(0, 0, 0, 0);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        // 检查是否是今天
        if (date.getTime() === today.getTime()) {
            dayCell.classList.add('today');
        }
        
        // 检查是否是过去的日期
        if (date < today) {
            dayCell.classList.add('past');
        }
        
        // 查找当天的计划
        const dayPlan = dailyPlan.find(dp => {
            const dpDate = new Date(dp.date);
            dpDate.setHours(0, 0, 0, 0);
            return dpDate.getTime() === date.getTime();
        });
        
        // 日期数字
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        // 任务列表
        const tasksList = document.createElement('div');
        tasksList.className = 'calendar-day-tasks';
        
        if (dayPlan) {
            // 学习任务
            if (dayPlan.learningTask && dayPlan.learningTask.hours > 0) {
                const learningTask = document.createElement('div');
                learningTask.className = 'calendar-task learning-task';
                learningTask.innerHTML = `
                    <div class="task-name">📚 ${dayPlan.learningTask.name}</div>
                    <div class="task-hours">${dayPlan.learningTask.hours}小时</div>
                `;
                tasksList.appendChild(learningTask);
            }
            
            // 制作任务
            dayPlan.makingTasks.forEach(task => {
                const makingTask = document.createElement('div');
                makingTask.className = 'calendar-task making-task';
                makingTask.innerHTML = `
                    <div class="task-song">${task.songName}</div>
                    <div class="task-name">${task.taskName}</div>
                    <div class="task-hours">${task.hours}小时</div>
                `;
                tasksList.appendChild(makingTask);
            });
            
            // 总时长
            if (dayPlan.totalHours > 0) {
                const totalHours = document.createElement('div');
                totalHours.className = 'calendar-day-total';
                totalHours.textContent = `总计: ${dayPlan.totalHours.toFixed(1)}小时`;
                dayCell.appendChild(totalHours);
            }
        }
        
        dayCell.appendChild(tasksList);
        calendarGrid.appendChild(dayCell);
    }
    
    calendarWrapper.appendChild(calendarGrid);
    container.appendChild(calendarWrapper);
}

// 切换日历月份
function changeCalendarMonth(delta) {
    currentCalendarMonth += delta;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderDailyPlan();
}

// 时间线视图切换
function switchTimelineView(view) {
    currentTimelineView = view;
    
    if (view === 'timeline') {
        document.getElementById('timeline').style.display = 'block';
        document.getElementById('projectView').style.display = 'none';
        const dailyPlanView = document.getElementById('dailyPlanView');
        if (dailyPlanView) dailyPlanView.style.display = 'none';
        document.getElementById('timelineViewBtn').classList.add('active');
        document.getElementById('projectViewBtn').classList.remove('active');
        const dailyPlanBtn = document.getElementById('dailyPlanViewBtn');
        if (dailyPlanBtn) dailyPlanBtn.classList.remove('active');
    } else if (view === 'project') {
        document.getElementById('timeline').style.display = 'none';
        document.getElementById('projectView').style.display = 'block';
        const dailyPlanView = document.getElementById('dailyPlanView');
        if (dailyPlanView) dailyPlanView.style.display = 'none';
        document.getElementById('timelineViewBtn').classList.remove('active');
        document.getElementById('projectViewBtn').classList.add('active');
        const dailyPlanBtn = document.getElementById('dailyPlanViewBtn');
        if (dailyPlanBtn) dailyPlanBtn.classList.remove('active');
        renderProjectView();
    } else if (view === 'daily') {
        document.getElementById('timeline').style.display = 'none';
        document.getElementById('projectView').style.display = 'none';
        const dailyPlanView = document.getElementById('dailyPlanView');
        if (dailyPlanView) dailyPlanView.style.display = 'block';
        document.getElementById('timelineViewBtn').classList.remove('active');
        document.getElementById('projectViewBtn').classList.remove('active');
        const dailyPlanBtn = document.getElementById('dailyPlanViewBtn');
        if (dailyPlanBtn) dailyPlanBtn.classList.add('active');
        renderDailyPlan();
    }
}

// 显示鼓励信息
function showEncouragement(type, message) {
    const modal = document.getElementById('encouragementModal');
    const icon = document.getElementById('encouragementIcon');
    const title = document.getElementById('encouragementTitle');
    const msg = document.getElementById('encouragementMessage');

    const encouragements = {
        taskComplete: {
            icon: '🎉',
            title: '任务完成！',
            message: message || '你完成了一个任务，继续加油！'
        },
        songComplete: {
            icon: '🏆',
            title: '歌曲完成！',
            message: message || '恭喜你完成了一首歌！这是巨大的进步！'
        },
        milestone: {
            icon: '⭐',
            title: '里程碑达成！',
            message: message || '你达到了一个重要的里程碑！'
        },
        progress: {
            icon: '💪',
            title: '进度不错！',
            message: message || '你的进度很好，继续保持！'
        }
    };

    const enc = encouragements[type] || encouragements.progress;
    icon.textContent = enc.icon;
    title.textContent = enc.title;
    msg.textContent = enc.message;
    modal.style.display = 'flex';
}

// 关闭鼓励提示
function closeEncouragement() {
    document.getElementById('encouragementModal').style.display = 'none';
}

// 检查并显示鼓励
function checkAndShowEncouragement() {
    const completedSongs = songs.filter(s => s.currentStage === '已完成').length;
    const totalProgress = songs.reduce((sum, s) => sum + calculateProgress(s), 0) / songs.length;

    // 检查里程碑
    if (completedSongs === 1 && !localStorage.getItem('milestone_1')) {
        showEncouragement('milestone', '恭喜完成第一首歌！这是一个重要的开始！');
        localStorage.setItem('milestone_1', 'true');
    } else if (completedSongs === 3 && !localStorage.getItem('milestone_3')) {
        showEncouragement('milestone', '太棒了！你已经完成了25%的歌曲！');
        localStorage.setItem('milestone_3', 'true');
    } else if (completedSongs === 5 && !localStorage.getItem('milestone_5')) {
        showEncouragement('milestone', '了不起！你已经完成了一半！继续坚持！');
        localStorage.setItem('milestone_5', 'true');
    } else if (completedSongs === 7 && !localStorage.getItem('milestone_7')) {
        showEncouragement('milestone', '接近终点了！你已经完成了75%！');
        localStorage.setItem('milestone_7', 'true');
    } else if (completedSongs === 9 && !localStorage.getItem('milestone_9')) {
        showEncouragement('songComplete', '🎊 恭喜！你完成了所有9首歌！这是一个了不起的成就！');
        localStorage.setItem('milestone_9', 'true');
    }

    // 检查整体进度
    if (totalProgress >= 50 && !localStorage.getItem('progress_50')) {
        showEncouragement('progress', '你的整体进度已经超过50%！继续保持这个节奏！');
        localStorage.setItem('progress_50', 'true');
    }
}

// 显示下一个知识点
function showNextKnowledge() {
    currentKnowledgeIndex = (currentKnowledgeIndex + 1) % KNOWLEDGE_BASE.length;
    const knowledge = KNOWLEDGE_BASE[currentKnowledgeIndex];
    document.getElementById('knowledgeContent').innerHTML = `
        <div class="knowledge-title">${knowledge.title}</div>
        <div class="knowledge-text">${knowledge.content}</div>
    `;
}

// 初始化知识点
function initKnowledge() {
    // 随机选择一个知识点
    currentKnowledgeIndex = Math.floor(Math.random() * KNOWLEDGE_BASE.length);
    showNextKnowledge();
}

// ==================== 音乐理论功能 ====================

// Tab 切换
function switchTab(tabName) {
    // 隐藏所有 tab 内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有 tab 按钮的 active 状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的 tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // 激活对应的按钮
    const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.includes(tabName === 'schedule' ? '日程规划' : '音乐理论')
    );
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // 如果切换到音乐理论 tab，初始化相关功能
    if (tabName === 'theory') {
        if (!window.circleOfFifthsInitialized) {
            initCircleOfFifths();
            window.circleOfFifthsInitialized = true;
        }
        if (!window.chordProgressionsInitialized) {
            updateChordProgressions();
            window.chordProgressionsInitialized = true;
        }
        if (!window.chordTypesInitialized) {
            renderChordTypes();
            window.chordTypesInitialized = true;
        }
        if (!window.chordDegreesInitialized) {
            updateChordDegrees();
            window.chordDegreesInitialized = true;
        }
        if (!window.chordExamplesInitialized) {
            renderChordExamples();
            window.chordExamplesInitialized = true;
        }
        if (!window.modalScalesInitialized) {
            renderModalScales();
            window.modalScalesInitialized = true;
        }
    }
}

// 和弦知识速查 tab 切换
function switchChordRefTab(tabName) {
    // 隐藏所有内容
    document.querySelectorAll('.chord-ref-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有 tab 按钮的 active 状态
    document.querySelectorAll('.chord-ref-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的内容
    const targetContent = document.getElementById('chord' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Content');
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // 激活对应的按钮
    const targetBtn = Array.from(document.querySelectorAll('.chord-ref-tab')).find(btn => 
        btn.textContent.includes(tabName === 'types' ? '基础' : tabName === 'degrees' ? '级数' : '示例')
    );
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

// 五度圈数据
const CIRCLE_OF_FIFTHS = [
    { major: 'C', minor: 'Am', sharps: 0, flats: 0, sharpNotes: [], flatNotes: [] },
    { major: 'G', minor: 'Em', sharps: 1, flats: 0, sharpNotes: ['F#'], flatNotes: [] },
    { major: 'D', minor: 'Bm', sharps: 2, flats: 0, sharpNotes: ['F#', 'C#'], flatNotes: [] },
    { major: 'A', minor: 'F#m', sharps: 3, flats: 0, sharpNotes: ['F#', 'C#', 'G#'], flatNotes: [] },
    { major: 'E', minor: 'C#m', sharps: 4, flats: 0, sharpNotes: ['F#', 'C#', 'G#', 'D#'], flatNotes: [] },
    { major: 'B', minor: 'G#m', sharps: 5, flats: 0, sharpNotes: ['F#', 'C#', 'G#', 'D#', 'A#'], flatNotes: [] },
    { major: 'F#', minor: 'D#m', sharps: 6, flats: 0, sharpNotes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], flatNotes: [] },
    { major: 'C#', minor: 'A#m', sharps: 7, flats: 0, sharpNotes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'], flatNotes: [] },
    { major: 'F', minor: 'Dm', sharps: 0, flats: 1, sharpNotes: [], flatNotes: ['Bb'] },
    { major: 'Bb', minor: 'Gm', sharps: 0, flats: 2, sharpNotes: [], flatNotes: ['Bb', 'Eb'] },
    { major: 'Eb', minor: 'Cm', sharps: 0, flats: 3, sharpNotes: [], flatNotes: ['Bb', 'Eb', 'Ab'] },
    { major: 'Ab', minor: 'Fm', sharps: 0, flats: 4, sharpNotes: [], flatNotes: ['Bb', 'Eb', 'Ab', 'Db'] }
];

// 音符到频率的映射（A4 = 440Hz）
const NOTE_FREQUENCIES = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
    'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

// 音程（半音数）
const INTERVALS = {
    'minor2nd': 1, 'major2nd': 2, 'minor3rd': 3, 'major3rd': 4,
    'perfect4th': 5, 'tritone': 6, 'perfect5th': 7, 'minor6th': 8,
    'major6th': 9, 'minor7th': 10, 'major7th': 11, 'octave': 12
};

// 和弦类型定义
const CHORD_TYPES = {
    'major': { name: '大三和弦', intervals: [0, 4, 7], description: '由根音、大三度、纯五度组成，明亮、稳定' },
    'minor': { name: '小三和弦', intervals: [0, 3, 7], description: '由根音、小三度、纯五度组成，柔和、忧郁' },
    'augmented': { name: '增三和弦', intervals: [0, 4, 8], description: '由根音、大三度、增五度组成，紧张、不稳定' },
    'diminished': { name: '减三和弦', intervals: [0, 3, 6], description: '由根音、小三度、减五度组成，非常紧张、不稳定' },
    'dominant7': { name: '属七和弦', intervals: [0, 4, 7, 10], description: '由根音、大三度、纯五度、小七度组成，需要解决到主和弦' },
    'major7': { name: '大七和弦', intervals: [0, 4, 7, 11], description: '由根音、大三度、纯五度、大七度组成，爵士感、柔和' },
    'minor7': { name: '小七和弦', intervals: [0, 3, 7, 10], description: '由根音、小三度、纯五度、小七度组成，柔和、爵士感' }
};

// 常见和弦进行
const COMMON_PROGRESSIONS = [
    { name: '流行进行', degrees: 'I-V-vi-IV', description: '最流行的和弦进行，出现在无数流行歌曲中，如《Let It Be》、《Don\'t Stop Believin\'》等' },
    { name: '爵士进行', degrees: 'ii-V-I', description: '经典的爵士和弦进行，ii级、V级、I级，是爵士音乐的基础' },
    { name: '卡农进行', degrees: 'vi-IV-I-V', description: '帕赫贝尔卡农的经典和弦进行，非常优美，适合抒情歌曲' },
    { name: '五十年代进行', degrees: 'I-vi-IV-V', description: '50年代流行音乐常用的和弦进行，如《Stand By Me》等' },
    { name: '小调进行', degrees: 'i-iv-V', description: '小调中常见的和弦进行，柔和、忧郁' },
    { name: '蓝调进行', degrees: 'I-I-I-I-IV-IV-I-I-V-IV-I-V', description: '12小节蓝调进行，是蓝调音乐的标准形式' }
];

// 中古调式音程结构（从明亮到黑暗）
const MODAL_SCALES = {
    'lydian': { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], description: '全全全半全全半 - 最明亮，带有增四度的神秘感' },
    'ionian': { name: 'Ionian (Major)', intervals: [0, 2, 4, 5, 7, 9, 11], description: '全全半全全全半 - 大调音阶，明亮稳定' },
    'mixolydian': { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], description: '全全半全全半全 - 属调式，带有小七度的爵士感' },
    'dorian': { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], description: '全半全全全半全 - 小调色彩但带有大六度，柔和而明亮' },
    'aeolian': { name: 'Aeolian (Minor)', intervals: [0, 2, 3, 5, 7, 8, 10], description: '全半全全半全全 - 自然小调，柔和忧郁' },
    'phrygian': { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], description: '半全全全半全全 - 带有小二度的异域感，神秘而紧张' },
    'locrian': { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], description: '半全全半全全全 - 最黑暗，带有减五度的不稳定感' }
};

// 各调的和弦级数映射
const CHORD_DEGREES = {
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
};

// 获取音符名称（处理升降号）
function getNoteName(note) {
    const noteMap = {
        'C': 'C', 'C#': 'C#', 'Db': 'C#', 'D': 'D', 'D#': 'D#', 'Eb': 'D#',
        'E': 'E', 'F': 'F', 'F#': 'F#', 'Gb': 'F#', 'G': 'G', 'G#': 'G#',
        'Ab': 'G#', 'A': 'A', 'A#': 'A#', 'Bb': 'A#', 'B': 'B'
    };
    return noteMap[note] || note;
}

// 计算音程（半音数）
function getInterval(note1, note2) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // 标准化音符名称
    const flatToSharp = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    
    let normalizedNote1 = flatToSharp[note1] || note1;
    let normalizedNote2 = flatToSharp[note2] || note2;
    
    const note1Index = notes.indexOf(normalizedNote1);
    const note2Index = notes.indexOf(normalizedNote2);
    
    if (note1Index === -1 || note2Index === -1) return 0;
    return (note2Index - note1Index + 12) % 12;
}

// 获取和弦的所有音符
function getChordNotes(rootNote, chordType) {
    const chord = CHORD_TYPES[chordType];
    if (!chord) return [];
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // 标准化音符名称（将降号转换为升号）
    let normalizedNote = rootNote;
    const flatToSharp = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    if (flatToSharp[rootNote]) {
        normalizedNote = flatToSharp[rootNote];
    }
    
    const rootIndex = notes.indexOf(normalizedNote);
    if (rootIndex === -1) return [];
    
    return chord.intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return notes[noteIndex];
    });
}

// 获取调式的所有音符
function getModalScaleNotes(rootNote, mode) {
    const scale = MODAL_SCALES[mode];
    if (!scale) return [];
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // 标准化音符名称（将降号转换为升号）
    let normalizedNote = rootNote;
    const flatToSharp = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    if (flatToSharp[rootNote]) {
        normalizedNote = flatToSharp[rootNote];
    }
    
    const rootIndex = notes.indexOf(normalizedNote);
    if (rootIndex === -1) return [];
    
    return scale.intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return notes[noteIndex];
    });
}

// 获取调式的音程关系字符串
function getModalScaleIntervalsString(rootNote, mode) {
    const notes = getModalScaleNotes(rootNote, mode);
    if (notes.length === 0) return '';
    
    const intervals = notes.map((note, index) => {
        if (index === 0) return '0st';
        const prevNote = notes[index - 1];
        const interval = getInterval(prevNote, note);
        return `+${interval}st`;
    });
    
    return intervals.join(', ');
}

// 播放调式音阶
function playModalScale(rootNote, mode) {
    console.log('播放调式:', rootNote, mode);
    
    // 停止当前播放
    stopChord();
    
    initAudioContext();
    
    const scaleNotes = getModalScaleNotes(rootNote, mode);
    console.log('调式音符:', scaleNotes);
    if (scaleNotes.length === 0) {
        console.warn('无法获取调式音符:', rootNote, mode);
        return;
    }
    
    // 确保音频上下文已激活
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            playModalScaleInternal(scaleNotes);
        }).catch(err => {
            console.error('无法恢复音频上下文:', err);
            alert('无法播放音频，请确保浏览器允许音频播放');
        });
    } else {
        playModalScaleInternal(scaleNotes);
    }
}

function playModalScaleInternal(scaleNotes) {
    if (!audioContext || audioContext.state !== 'running') {
        console.warn('音频上下文未就绪:', audioContext?.state);
        return;
    }
    
    // 音阶模式：顺序播放每个音，每个音播放0.6秒
    // 所有音都在同一个八度（C3）播放，保持音阶的连贯性
    scaleNotes.forEach((note, index) => {
        const frequency = NOTE_FREQUENCIES[note];
        if (frequency) {
            // 音阶模式：所有音都在C3八度播放（NOTE_FREQUENCIES是C4，所以乘以0.5）
            const actualFreq = frequency * 0.5;
            
            setTimeout(() => {
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = actualFreq;
                    oscillator.type = 'sine';
                    
                    // 淡入淡出
                    const now = audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
                    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.4);
                    gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
                    
                    oscillator.start(now);
                    oscillator.stop(now + 0.6);
                    
                    currentOscillators.push({ oscillator, gainNode });
                } catch (err) {
                    console.error('创建音频节点失败:', err);
                }
            }, index * 600); // 每个音间隔600ms
        }
    });
}

// 渲染中古调式
function renderModalScales() {
    const container = document.getElementById('modalScalesList');
    if (!container) return;
    
    const rootNote = document.getElementById('modalRootNote').value;
    if (!rootNote) return;
    
    container.innerHTML = '';
    
    // 按明亮到黑暗的顺序渲染
    const modeOrder = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];
    
    modeOrder.forEach(mode => {
        const scale = MODAL_SCALES[mode];
        const notes = getModalScaleNotes(rootNote, mode);
        const intervalsString = getModalScaleIntervalsString(rootNote, mode);
        
        const card = document.createElement('div');
        card.className = 'modal-scale-card';
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
            <div class="modal-scale-name">${scale.name}</div>
            <div class="modal-scale-description">${scale.description}</div>
            <div class="modal-scale-notes">${notes.join(', ')}</div>
            <div class="modal-scale-intervals">(${intervalsString})</div>
        `;
        
        card.addEventListener('click', () => {
            playModalScale(rootNote, mode);
        });
        
        container.appendChild(card);
    });
}

// 获取和弦的音程关系字符串
function getChordIntervalsString(rootNote, chordType) {
    const notes = getChordNotes(rootNote, chordType);
    if (notes.length === 0) return '';
    
    const intervals = notes.map((note, index) => {
        if (index === 0) return '0st';
        const prevNote = notes[index - 1];
        const interval = getInterval(prevNote, note);
        return `+${interval}st`;
    });
    
    return intervals.join(', ');
}

// 播放和弦
let audioContext = null;
let currentOscillators = [];

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 如果音频上下文被暂停（需要用户交互），尝试恢复
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => {
            console.error('无法恢复音频上下文:', err);
        });
    }
}

function playChord(rootNote, isMajor = true) {
    console.log('播放和弦:', rootNote, isMajor ? 'major' : 'minor');
    
    // 停止当前播放
    stopChord();
    
    initAudioContext();
    
    // 确保音频上下文已激活
    if (audioContext.state === 'suspended') {
        console.log('音频上下文被暂停，尝试恢复...');
        audioContext.resume().then(() => {
            console.log('音频上下文已恢复');
            playChordInternal(rootNote, isMajor);
        }).catch(err => {
            console.error('无法恢复音频上下文:', err);
            alert('无法播放音频，请确保浏览器允许音频播放');
        });
    } else {
        playChordInternal(rootNote, isMajor);
    }
}

function playChordInternal(rootNote, isMajor = true) {
    const chordType = isMajor ? 'major' : 'minor';
    const notes = getChordNotes(rootNote, chordType);
    
    console.log('和弦音符:', notes);
    
    if (notes.length === 0) {
        console.warn('无法获取和弦音符:', rootNote, chordType);
        return;
    }
    
    if (!audioContext || audioContext.state !== 'running') {
        console.warn('音频上下文未就绪:', audioContext?.state);
        return;
    }
    
    notes.forEach((note, index) => {
        const frequency = NOTE_FREQUENCIES[note];
        if (frequency) {
            // 使用不同八度，让和弦更丰富
            const octave = index === 0 ? 1 : index === 1 ? 1.5 : 2;
            const actualFreq = frequency * octave;
            
            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = actualFreq;
                oscillator.type = 'sine';
                
                // 淡入淡出
                const now = audioContext.currentTime;
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.5);
                gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
                
                oscillator.start(now);
                oscillator.stop(now + 1.0);
                
                currentOscillators.push({ oscillator, gainNode });
            } catch (err) {
                console.error('创建音频节点失败:', err);
            }
        }
    });
}

function stopChord() {
    currentOscillators.forEach(({ oscillator, gainNode }) => {
        try {
            oscillator.stop();
            gainNode.disconnect();
        } catch (e) {
            // 忽略错误
        }
    });
    currentOscillators = [];
}

// 绘制扇形路径
function createSectorPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
    // startAngle 和 endAngle 已经是相对于顶部的角度（已减90度），直接转换为弧度
    const startAngleRad = startAngle * (Math.PI / 180);
    const endAngleRad = endAngle * (Math.PI / 180);
    
    const x1 = centerX + innerRadius * Math.cos(startAngleRad);
    const y1 = centerY + innerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(startAngleRad);
    const y2 = centerY + outerRadius * Math.sin(startAngleRad);
    const x3 = centerX + outerRadius * Math.cos(endAngleRad);
    const y3 = centerY + outerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(endAngleRad);
    const y4 = centerY + innerRadius * Math.sin(endAngleRad);
    
    // 计算角度差，处理跨0度的情况
    let angleDiff = endAngle - startAngle;
    if (angleDiff < 0) angleDiff += 360;
    const largeArc = angleDiff > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
}

// 初始化五度圈
function initCircleOfFifths() {
    const container = document.getElementById('circleOfFifths');
    if (!container) return;
    
    const size = 800;
    const padding = 50; // 增加边距确保文字不被裁剪
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 280;
    const middleRadius = 220;
    const innerRadius = 160;
    const signatureRadius = 320;
    const sectorAngle = 360 / 12; // 每个扇形30度
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('class', 'circle-of-fifths-svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.overflow = 'visible';
    
    // 确保所有12个调都被渲染
    console.log('开始渲染五度圈，共', CIRCLE_OF_FIFTHS.length, '个调');
    
    CIRCLE_OF_FIFTHS.forEach((key, index) => {
        // 计算角度：从顶部（-90度）开始，每个扇形30度
        const startAngle = index * sectorAngle - 90; // 从顶部开始
        const endAngle = (index + 1) * sectorAngle - 90;
        const centerAngle = (startAngle + endAngle) / 2;
        const centerAngleRad = centerAngle * (Math.PI / 180);
        
        console.log(`渲染第${index + 1}个调: ${key.major}/${key.minor}, 角度: ${startAngle.toFixed(1)}° - ${endAngle.toFixed(1)}°, 中心: ${centerAngle.toFixed(1)}°`);
        
        // 调号位置（最外圈）- 直接添加到SVG
        const sigX = centerX + signatureRadius * Math.cos(centerAngleRad);
        const sigY = centerY + signatureRadius * Math.sin(centerAngleRad);
        const sigText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sigText.setAttribute('x', String(sigX));
        sigText.setAttribute('y', String(sigY));
        sigText.setAttribute('text-anchor', 'middle');
        sigText.setAttribute('dominant-baseline', 'central');
        sigText.setAttribute('class', 'circle-key-signature');
        sigText.setAttribute('style', 'font-size: 12px; fill: #666;');
        let sigLabel = '';
        if (key.sharps > 0) {
            sigLabel = key.sharps + '♯';
        } else if (key.flats > 0) {
            sigLabel = key.flats + '♭';
        } else {
            sigLabel = '0';
        }
        sigText.textContent = sigLabel;
        svg.appendChild(sigText);
        
        // 外圈：大调扇形
        const majorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        majorGroup.setAttribute('class', 'circle-key-group');
        majorGroup.setAttribute('data-key', key.major);
        majorGroup.setAttribute('data-type', 'major');
        majorGroup.style.cursor = 'pointer';
        
        const majorSector = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        majorSector.setAttribute('d', createSectorPath(centerX, centerY, middleRadius, outerRadius, startAngle, endAngle));
        majorSector.setAttribute('class', 'circle-key circle-key-major');
        majorSector.setAttribute('data-key', key.major);
        majorSector.setAttribute('data-type', 'major');
        majorGroup.appendChild(majorSector);
        
        // 大调文字 - 先创建文字元素，以便在事件监听器中使用
        const majorTextRadius = (middleRadius + outerRadius) / 2;
        const majorTextX = centerX + majorTextRadius * Math.cos(centerAngleRad);
        const majorTextY = centerY + majorTextRadius * Math.sin(centerAngleRad);
        const majorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        majorText.setAttribute('x', String(majorTextX));
        majorText.setAttribute('y', String(majorTextY));
        majorText.setAttribute('text-anchor', 'middle');
        majorText.setAttribute('dominant-baseline', 'central');
        majorText.setAttribute('class', 'circle-key-text circle-key-text-major');
        majorText.setAttribute('data-key', key.major);
        majorText.setAttribute('data-type', 'major');
        majorText.setAttribute('style', 'font-size: 24px; font-weight: 400; font-family: Arial, sans-serif; fill: #1a1a1a; stroke: none; opacity: 1; pointer-events: none;');
        majorText.textContent = key.major;
        
        // 小调文字 - 先创建文字元素，以便在事件监听器中使用
        const minorTextRadius = (innerRadius + middleRadius) / 2;
        const minorTextX = centerX + minorTextRadius * Math.cos(centerAngleRad);
        const minorTextY = centerY + minorTextRadius * Math.sin(centerAngleRad);
        const minorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        minorText.setAttribute('x', String(minorTextX));
        minorText.setAttribute('y', String(minorTextY));
        minorText.setAttribute('text-anchor', 'middle');
        minorText.setAttribute('dominant-baseline', 'central');
        minorText.setAttribute('class', 'circle-key-text circle-key-text-minor');
        minorText.setAttribute('data-key', key.minor);
        minorText.setAttribute('data-type', 'minor');
        minorText.setAttribute('style', 'font-size: 20px; font-weight: 400; font-family: Arial, sans-serif; fill: #1a1a1a; stroke: none; opacity: 1; pointer-events: none;');
        minorText.textContent = key.minor;
        
        // 大调hover事件
        majorGroup.addEventListener('mouseenter', () => {
            majorText.setAttribute('fill', 'white');
        });
        majorGroup.addEventListener('mouseleave', () => {
            majorText.setAttribute('fill', '#1a1a1a');
        });
        
        majorGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            // 外圈：播放大调
            playChord(key.major, true);
        });
        
        svg.appendChild(majorGroup);
        
        // 内圈：小调扇形
        const minorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        minorGroup.setAttribute('class', 'circle-key-group');
        minorGroup.setAttribute('data-key', key.minor);
        minorGroup.setAttribute('data-type', 'minor');
        minorGroup.style.cursor = 'pointer';
        
        const minorSector = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        minorSector.setAttribute('d', createSectorPath(centerX, centerY, innerRadius, middleRadius, startAngle, endAngle));
        minorSector.setAttribute('class', 'circle-key circle-key-minor');
        minorSector.setAttribute('data-key', key.minor);
        minorSector.setAttribute('data-type', 'minor');
        minorGroup.appendChild(minorSector);
        
        // 小调hover事件
        minorGroup.addEventListener('mouseenter', () => {
            minorText.setAttribute('fill', 'white');
        });
        minorGroup.addEventListener('mouseleave', () => {
            minorText.setAttribute('fill', '#1a1a1a');
        });
        
        minorGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            // 内圈：播放小调
            // 从 "Am", "F#m", "D#m" 等格式中提取根音
            let rootNote = key.minor.replace(/m$/, ''); // 移除末尾的 'm'
            playChord(rootNote, false);
        });
        
        svg.appendChild(minorGroup);
        
        // 文字添加到SVG根元素，确保显示在最上层
        svg.appendChild(majorText);
        svg.appendChild(minorText);
    });
    
    container.innerHTML = '';
    container.appendChild(svg);
    
}

// 更新和弦进行
function updateChordProgressions() {
    const key = document.getElementById('progressionKey').value;
    const container = document.getElementById('chordProgressions');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 级数到和弦级数标记的映射
    const degreeToChordDegree = {
        'I': 'I', 'i': 'I',
        'II': 'IIm', 'ii': 'IIm',
        'III': 'IIIm', 'iii': 'IIIm',
        'IV': 'IV', 'iv': 'IV',
        'V': 'V', 'v': 'V',
        'VI': 'VIm', 'vi': 'VIm',
        'VII': 'VII°', 'vii': 'VII°'
    };
    
    COMMON_PROGRESSIONS.forEach(progression => {
        const card = document.createElement('div');
        card.className = 'progression-card';
        
        const degrees = progression.degrees.split('-');
        const actualChords = degrees.map(degree => {
            // 移除可能的修饰符（如°）
            const cleanDegree = degree.replace('°', '').trim();
            const chordDegree = degreeToChordDegree[cleanDegree];
            if (chordDegree && CHORD_DEGREES[key]) {
                const chord = CHORD_DEGREES[key][chordDegree];
                return chord || degree;
            }
            return degree;
        });
        
        // 对于蓝调进行等长进行，限制显示数量
        const displayChords = actualChords.length > 8 
            ? [...actualChords.slice(0, 8), '...'] 
            : actualChords;
        
        card.innerHTML = `
            <div class="progression-name">${progression.name}</div>
            <div class="progression-degrees">${progression.degrees}</div>
            <div class="progression-chords">
                ${displayChords.map(chord => `<span class="chord-badge">${chord}</span>`).join('')}
            </div>
            <div class="progression-description">${progression.description}</div>
        `;
        container.appendChild(card);
    });
}

// 渲染和弦类型
function renderChordTypes() {
    const container = document.getElementById('chordTypesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(CHORD_TYPES).forEach(chordType => {
        const chord = CHORD_TYPES[chordType];
        const card = document.createElement('div');
        card.className = 'chord-type-card';
        
        // 使用 C 作为示例根音
        const rootNote = 'C';
        const notes = getChordNotes(rootNote, chordType);
        const intervals = getChordIntervalsString(rootNote, chordType);
        
        card.innerHTML = `
            <div class="chord-type-name">${chord.name}</div>
            <div class="chord-construction">
                <div class="chord-construction-label">和弦构成（以 C 为例）：</div>
                <div class="chord-notes">${notes.join(', ')}</div>
                <div class="chord-intervals">(${intervals})</div>
            </div>
            <div class="chord-type-description">${chord.description}</div>
        `;
        container.appendChild(card);
    });
}

// 更新和弦级数表
function updateChordDegrees() {
    const key = document.getElementById('degreeKey').value;
    const container = document.getElementById('chordDegreesTable');
    if (!container) return;
    
    const degrees = CHORD_DEGREES[key];
    if (!degrees) return;
    
    container.innerHTML = '';
    
    const degreeOrder = ['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm', 'VII°'];
    degreeOrder.forEach(degree => {
        const chord = degrees[degree];
        const item = document.createElement('div');
        item.className = 'degree-item';
        
        const type = degree.includes('m') ? '小三和弦' : degree.includes('°') ? '减三和弦' : '大三和弦';
        
        item.innerHTML = `
            <div class="degree-number">${degree}</div>
            <div class="degree-chord">${chord}</div>
            <div class="degree-type">${type}</div>
        `;
        container.appendChild(item);
    });
}

// 渲染和弦进行示例
function renderChordExamples() {
    const container = document.getElementById('chordExamplesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const examples = [
        {
            name: 'I-V-vi-IV (流行进行)',
            progression: 'C - G - Am - F',
            description: '这是最流行的和弦进行，出现在无数流行歌曲中，如《Let It Be》、《Don\'t Stop Believin\'》等。'
        },
        {
            name: 'vi-IV-I-V (卡农进行)',
            progression: 'Am - F - C - G',
            description: '帕赫贝尔卡农的经典和弦进行，非常优美，适合抒情歌曲。'
        },
        {
            name: 'ii-V-I (爵士进行)',
            progression: 'Dm - G - C',
            description: '经典的爵士和弦进行，ii级、V级、I级，是爵士音乐的基础。'
        },
        {
            name: 'I-vi-IV-V (五十年代进行)',
            progression: 'C - Am - F - G',
            description: '50年代流行音乐常用的和弦进行，如《Stand By Me》等。'
        }
    ];
    
    examples.forEach(example => {
        const card = document.createElement('div');
        card.className = 'chord-example-card';
        card.innerHTML = `
            <div class="example-name">${example.name}</div>
            <div class="example-progression">${example.progression}</div>
            <div class="example-description">${example.description}</div>
        `;
        container.appendChild(card);
    });
}

// 打开设置开始日期模态框
function openStartDateModal() {
    const modal = document.getElementById('startDateModal');
    const startDate = getStartDate();
    const dateInput = document.getElementById('startDateInput');
    const timeConfig = getTimeConfig();
    
    // 将日期格式化为 YYYY-MM-DD
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    
    // 设置时间配置
    const learningHoursInput = document.getElementById('dailyLearningHours');
    const makingHoursInput = document.getElementById('dailyMakingHours');
    if (learningHoursInput) {
        learningHoursInput.value = timeConfig.dailyLearningHours;
    }
    if (makingHoursInput) {
        makingHoursInput.value = timeConfig.dailyMakingHours;
    }
    
    modal.style.display = 'flex';
}

// 关闭设置开始日期模态框
function closeStartDateModal() {
    document.getElementById('startDateModal').style.display = 'none';
}

// 保存开始日期
function saveStartDate(event) {
    event.preventDefault();
    const dateInput = document.getElementById('startDateInput');
    const dateValue = dateInput.value;
    
    if (!dateValue) {
        alert('请选择开始日期');
        return;
    }
    
    const selectedDate = new Date(dateValue);
    selectedDate.setHours(0, 0, 0, 0);
    setStartDate(selectedDate);
    
    // 保存时间配置
    const learningHoursInput = document.getElementById('dailyLearningHours');
    const makingHoursInput = document.getElementById('dailyMakingHours');
    if (learningHoursInput && makingHoursInput) {
        const learningHours = parseFloat(learningHoursInput.value) || DEFAULT_LEARNING_HOURS;
        const makingHours = parseFloat(makingHoursInput.value) || DEFAULT_MAKING_HOURS;
        updateTimeConfig(learningHours, makingHours);
    }
    
    // 刷新所有显示
    renderSongs();
    renderTimeline();
    renderProjectView();
    renderGantt();
    renderDailyPlan();
    updateStats();
    
    closeStartDateModal();
    alert('设置已更新！');
}

// 导出函数供全局使用
window.editSong = editSong;
window.deleteSong = deleteSong;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.pauseTimer = pauseTimer;
window.resumeTimer = resumeTimer;
window.switchGanttView = switchGanttView;
window.switchTimelineView = switchTimelineView;
window.showNextKnowledge = showNextKnowledge;
window.closeEncouragement = closeEncouragement;
window.switchTab = switchTab;
window.switchChordRefTab = switchChordRefTab;
window.updateChordProgressions = updateChordProgressions;
window.updateChordDegrees = updateChordDegrees;
window.renderModalScales = renderModalScales;
window.exportData = exportData;
window.importData = importData;
window.openStartDateModal = openStartDateModal;
window.closeStartDateModal = closeStartDateModal;
window.saveStartDate = saveStartDate;
window.updateTaskHoursDisplay = updateTaskHoursDisplay;
window.adjustTaskHour = adjustTaskHour;
window.recalculateTotalHours = recalculateTotalHours;
window.changeCalendarMonth = changeCalendarMonth;

