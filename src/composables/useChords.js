import { ref } from 'vue'
import { NOTE_FREQUENCIES, CHORD_TYPES, CHORD_DEGREES, COMMON_PROGRESSIONS } from '@/utils/constants'
import { getNoteName, getChordNotes } from '@/utils/helpers'

export function useChords() {
  const audioContext = ref(null)
  const activeOscillators = ref([])

  // 初始化 Audio Context
  function initAudioContext() {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  // 播放单个音符
  function playNote(frequency, duration = 1000) {
    initAudioContext()

    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    // ADSR 包络
    const now = audioContext.value.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01) // Attack
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1) // Decay
    gainNode.gain.setValueAtTime(0.2, now + duration / 1000 - 0.1) // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000) // Release

    oscillator.start(now)
    oscillator.stop(now + duration / 1000)

    return { oscillator, gainNode }
  }

  // 播放和弦
  function playChord(rootNote, chordType = 'major', duration = 2000, stopPrevious = true) {
    initAudioContext()
    if (stopPrevious) {
      stopChord() // 停止之前的声音
    }

    const chordDef = CHORD_TYPES[chordType]
    if (!chordDef) {
      console.error('Unknown chord type:', chordType)
      return
    }

    const chordNotes = getChordNotes(rootNote, chordDef.intervals)
    
    chordNotes.forEach(note => {
      const frequency = NOTE_FREQUENCIES[getNoteName(note)]
      if (frequency) {
        const { oscillator, gainNode } = playNote(frequency, duration)
        activeOscillators.value.push({ oscillator, gainNode })
      }
    })
  }

  // 播放自定义音程的和弦
  function playChordWithIntervals(rootNote, intervals, duration = 2000, stopPrevious = true) {
    initAudioContext()
    if (stopPrevious) {
      stopChord() // 停止之前的声音
    }

    const chordNotes = getChordNotes(rootNote, intervals)
    
    // 降低音量避免失真（当音符数量多时）
    // 根据音符数量动态调整音量：3个音时正常音量，7个音时降低到约30%
    const noteCount = chordNotes.length
    let volumeScale = 1.0
    
    if (noteCount > 3) {
      // 超过3个音时，按比例降低音量
      // 7个音时，音量约为30%（3/7 ≈ 0.43，再乘以0.7）
      volumeScale = (3 / noteCount) * 0.7
    }
    
    chordNotes.forEach(note => {
      const frequency = NOTE_FREQUENCIES[getNoteName(note)]
      if (frequency) {
        const oscillator = audioContext.value.createOscillator()
        const gainNode = audioContext.value.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.value.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        // ADSR 包络，应用音量缩放
        const now = audioContext.value.currentTime
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.25 * volumeScale, now + 0.01) // Attack
        gainNode.gain.linearRampToValueAtTime(0.15 * volumeScale, now + 0.1) // Decay
        gainNode.gain.setValueAtTime(0.15 * volumeScale, now + duration / 1000 - 0.1) // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000) // Release

        oscillator.start(now)
        oscillator.stop(now + duration / 1000)

        activeOscillators.value.push({ oscillator, gainNode })
      }
    })
  }

  // 播放调式的特征三和弦（根音、三度、五度）
  function playModalScaleChord(rootNote, intervals, duration = 2000) {
    initAudioContext()
    stopChord() // 停止之前的声音

    // 从调式音程中提取三度和五度
    // intervals数组索引对应音阶位置：
    // [0, 1, 2, 3, 4, 5, 6] = [根音, 二度, 三度, 四度, 五度, 六度, 七度]
    let thirdInterval = intervals[2] // 三度音程（索引2）
    let fifthInterval = intervals[4] // 五度音程（索引4）

    // 如果索引2或4不存在，使用默认值
    if (thirdInterval === undefined) {
      thirdInterval = 4 // 默认大三度
    }
    if (fifthInterval === undefined) {
      fifthInterval = 7 // 默认纯五度
    }

    // 构建三和弦音程：[根音, 三度, 五度]
    const triadIntervals = [0, thirdInterval, fifthInterval]

    // 播放三和弦，降低音量避免失真
    const chordNotes = getChordNotes(rootNote, triadIntervals)
    const volumeScale = 0.15 // 降低音量到15%，避免失真
    
    chordNotes.forEach(note => {
      const frequency = NOTE_FREQUENCIES[getNoteName(note)]
      if (frequency) {
        const oscillator = audioContext.value.createOscillator()
        const gainNode = audioContext.value.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.value.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        // ADSR 包络，使用降低后的音量
        const now = audioContext.value.currentTime
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.3 * volumeScale, now + 0.01) // Attack
        gainNode.gain.linearRampToValueAtTime(0.2 * volumeScale, now + 0.1) // Decay
        gainNode.gain.setValueAtTime(0.2 * volumeScale, now + duration / 1000 - 0.1) // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000) // Release

        oscillator.start(now)
        oscillator.stop(now + duration / 1000)

        activeOscillators.value.push({ oscillator, gainNode })
      }
    })
  }

  // 转换级数格式，将小写转换为大写并添加后缀
  // 例如: "vi" -> "VIm", "ii" -> "IIm", "I" -> "I", "i" -> "VIm", "iv" -> "IIm"
  function normalizeDegree(degree) {
    // 移除所有空格
    degree = degree.trim()
    
    // 如果已经是正确格式（包含m或°），直接返回并确保罗马数字是大写
    if (degree.includes('m') || degree.includes('°')) {
      return degree.replace(/^([ivxlcdm]+)/i, (match) => match.toUpperCase())
    }
    
    // 小写罗马数字映射（小调级数）
    // 小调级数通常用小写表示，需要转换为大调中的对应级数
    const minorToMajorMap = {
      'i': 'VIm',    // 小调主和弦 = 大调vi级
      'ii': 'IIm',   // 小调ii级 = 大调ii级
      'iii': 'IIIm', // 小调iii级 = 大调iii级
      'iv': 'IIm',   // 小调下属和弦 = 大调ii级
      'v': 'V',      // 小调属和弦 = 大调V级（和声小调）
      'vi': 'VIm',   // 小调vi级 = 大调vi级
      'vii': 'VII°'  // 小调vii级 = 大调vii级
    }
    
    // 检查是否是小调级数（全小写）
    if (degree === degree.toLowerCase() && minorToMajorMap[degree.toLowerCase()]) {
      return minorToMajorMap[degree.toLowerCase()]
    }
    
    // 转换小写罗马数字为大写
    const upperDegree = degree.toUpperCase()
    
    // 检查CHORD_DEGREES中的键，找到匹配的格式
    // 可能的格式: I, IIm, IIIm, IV, V, VIm, VII°
    const degreeMap = {
      'I': 'I',
      'II': 'IIm',
      'III': 'IIIm',
      'IV': 'IV',
      'V': 'V',
      'VI': 'VIm',
      'VII': 'VII°'
    }
    
    // 尝试直接匹配
    if (degreeMap[upperDegree]) {
      return degreeMap[upperDegree]
    }
    
    return upperDegree
  }

  // 播放和弦进行
  function playChordProgression(rootKey, progression, tempo = 120) {
    const chordDegrees = CHORD_DEGREES[rootKey]
    if (!chordDegrees) {
      console.error('Unknown key:', rootKey)
      return
    }

    // 停止之前的所有声音
    stopChord()

    // 解析级数字符串，如 "I-V-vi-IV" 或 "I-V-VI-IV"
    const degrees = progression.split('-').map(d => normalizeDegree(d))
    const beatDuration = (60 / tempo) * 1000 // 每拍的毫秒数

    degrees.forEach((degree, index) => {
      setTimeout(() => {
        const chordName = chordDegrees[degree]
        if (chordName) {
          // 判断是大调还是小调
          const isMajor = !degree.includes('m') && !degree.includes('°')
          const chordType = degree.includes('°') ? 'diminished' : (isMajor ? 'major' : 'minor')
          
          // 提取根音
          const rootNote = chordName.replace(/m|dim|°/g, '')
          // 在播放进行时，不停止前一个和弦，让它们自然过渡
          playChord(rootNote, chordType, beatDuration * 0.9, false)
        } else {
          console.warn(`Chord degree "${degree}" not found in key "${rootKey}"`)
        }
      }, index * beatDuration)
    })
  }

  // 播放调式音阶
  function playModalScale(rootNote, intervals, tempo = 120, onNotePlay = null) {
    // 停止之前的声音
    stopChord()
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const root = getNoteName(rootNote)
    const rootIndex = notes.indexOf(root)
    
    if (rootIndex === -1) {
      console.error('Invalid root note:', rootNote)
      return
    }
    
    // 根据音程计算每个音符
    const scaleNotes = intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12
      return notes[noteIndex]
    })
    
    // 验证计算出的音符
    console.log(`Playing ${rootNote} scale:`, scaleNotes.join(' - '))
    console.log(`Intervals: [${intervals.join(', ')}]`)
    console.log(`Root note index: ${rootIndex} (${root})`)
    
    const noteDuration = (60 / tempo) * 500 // 每个音符的毫秒数

    scaleNotes.forEach((note, index) => {
      setTimeout(() => {
        const normalizedNote = getNoteName(note)
        const frequency = NOTE_FREQUENCIES[normalizedNote]
        if (frequency) {
          console.log(`Playing note ${index + 1}/${scaleNotes.length}: ${note} (${normalizedNote}) = ${frequency.toFixed(2)}Hz`)
          
          // 通知当前播放的音符索引
          if (onNotePlay) {
            onNotePlay(index)
          }
          
          playNote(frequency, noteDuration * 0.9)
        } else {
          console.error('Frequency not found for note:', note, normalizedNote)
        }
      }, index * noteDuration)
    })
  }

  // 停止所有声音
  function stopChord() {
    activeOscillators.value.forEach(({ oscillator, gainNode }) => {
      try {
        const now = audioContext.value?.currentTime || 0
        gainNode.gain.cancelScheduledValues(now)
        gainNode.gain.setValueAtTime(gainNode.gain.value, now)
        gainNode.gain.linearRampToValueAtTime(0, now + 0.01)
        oscillator.stop(now + 0.01)
      } catch (e) {
        // 忽略已经停止的振荡器
      }
    })
    activeOscillators.value = []
  }

  // 获取某个调的和弦进行
  function getChordProgressionsForKey(key) {
    const chordDegrees = CHORD_DEGREES[key]
    if (!chordDegrees) return []

    return COMMON_PROGRESSIONS.map(prog => {
      const degrees = prog.degrees.split('-').map(d => normalizeDegree(d))
      const chords = degrees.map(degree => chordDegrees[degree] || degree).join(' - ')
      
      return {
        name: prog.name,
        degrees: prog.degrees,
        chords: chords,
        description: prog.description
      }
    })
  }

  return {
    audioContext,
    playNote,
    playChord,
    playChordWithIntervals,
    playModalScaleChord,
    playChordProgression,
    playModalScale,
    stopChord,
    getChordProgressionsForKey
  }
}

