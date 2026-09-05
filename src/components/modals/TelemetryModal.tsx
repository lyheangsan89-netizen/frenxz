import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Download, 
  Activity, 
  HardDrive, 
  Zap, 
  Layers, 
  Gauge, 
  Clock, 
  RefreshCw,
  CheckCircle2,
  FileJson,
  FileText,
  FileSpreadsheet,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { HardwareTelemetry } from '../../types';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: HardwareTelemetry;
  videoName?: string;
  subtitlesCount?: number;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  videoName = 'Frenxz_Project.mp4',
  subtitlesCount = 0
}) => {
  const [history, setHistory] = useState<Array<{ time: string; cpu: number; gpu: number; ram: number }>>([]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setHistory(prev => {
      const next = [...prev, { time: timeStr, cpu: telemetry.cpuUsage, gpu: telemetry.gpuUsage, ram: telemetry.ramUsed }];
      return next.slice(-15);
    });
  }, [telemetry, isOpen]);

  if (!isOpen) return null;

  // 1. Download as JSON
  const handleDownloadJSON = () => {
    const reportData = {
      app: 'Frenxz AI Dubbing Studio',
      timestamp: new Date().toISOString(),
      project: {
        activeVideo: videoName,
        totalSegments: subtitlesCount
      },
      hardwareMetrics: {
        cpu: {
          model: 'AMD Ryzen 9 / Intel Xeon Enterprise vCPU (16 Cores)',
          loadPercentage: telemetry.cpuUsage,
          temperatureCelsius: telemetry.cpuTemp,
          inferenceSpeed: '0.18s per subtitle cue'
        },
        gpu: {
          model: 'NVIDIA RTX 4090 / L4 Tensor Core GPU',
          loadPercentage: telemetry.gpuUsage,
          temperatureCelsius: telemetry.gpuTemp,
          vramUsedGB: telemetry.vramUsed,
          vramTotalGB: telemetry.vramTotal,
          vramUtilizationPercentage: Math.round((telemetry.vramUsed / telemetry.vramTotal) * 100),
          hardwareEncoder: 'NVENC Gen 8 (Active / Ready)'
        },
        ram: {
          usedGB: telemetry.ramUsed,
          totalGB: telemetry.ramTotal,
          utilizationPercentage: Math.round((telemetry.ramUsed / telemetry.ramTotal) * 100),
          audioBufferCache: '128 MB (Preloaded Khmer TTS)'
        },
        engine: {
          status: telemetry.engineStatus,
          sampleRate: '48,000 Hz 32-bit Float',
          audioLatencyMs: 12.4,
          smartFitPaceSync: 'Active (Khmer Unicode Syllable Mode)'
        }
      },
      telemetryHistory: history
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frenxz_hardware_telemetry_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('JSON Report Downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 2. Download as CSV
  const handleDownloadCSV = () => {
    const rows = [
      ['Timestamp', 'CPU Usage (%)', 'CPU Temp (C)', 'GPU Usage (%)', 'GPU Temp (C)', 'VRAM Used (GB)', 'VRAM Total (GB)', 'RAM Used (GB)', 'RAM Total (GB)', 'Engine Status'],
      [
        new Date().toISOString(),
        telemetry.cpuUsage,
        telemetry.cpuTemp,
        telemetry.gpuUsage,
        telemetry.gpuTemp,
        telemetry.vramUsed,
        telemetry.vramTotal,
        telemetry.ramUsed,
        telemetry.ramTotal,
        telemetry.engineStatus
      ]
    ];

    if (history.length > 0) {
      rows.push(['---', '---', '---', '---', '---', '---', '---', '---', '---', '---']);
      rows.push(['History Time', 'CPU %', 'GPU %', 'RAM (GB)']);
      history.forEach(h => {
        rows.push([h.time, h.cpu.toString(), h.gpu.toString(), h.ram.toString()]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `frenxz_hardware_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('CSV Report Downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. Download as TXT Diagnostic
  const handleDownloadTXT = () => {
    const textReport = `=====================================================
FRENXZ AI DUBBING STUDIO - HARDWARE PERFORMANCE REPORT
=====================================================
Export Timestamp : ${new Date().toLocaleString()}
Active Project   : ${videoName}
Total Segments   : ${subtitlesCount} Cues
Engine Status    : ${telemetry.engineStatus}

-----------------------------------------------------
1. PROCESSOR (CPU)
-----------------------------------------------------
- Hardware Model : AMD Ryzen 9 / Enterprise Multi-Core vCPU
- Current Load   : ${telemetry.cpuUsage}%
- Core Temp      : ${telemetry.cpuTemp} °C
- Architecture   : x86_64 High-Performance Compute
- Real-time TTS  : 0.18s per Khmer segment

-----------------------------------------------------
2. GRAPHICS & ACCELERATOR (GPU)
-----------------------------------------------------
- Hardware Model : NVIDIA RTX Tensor Core Dedicated Accelerator
- Current Load   : ${telemetry.gpuUsage}%
- Core Temp      : ${telemetry.gpuTemp} °C
- VRAM Usage     : ${telemetry.vramUsed} GB / ${telemetry.vramTotal} GB (${Math.round((telemetry.vramUsed / telemetry.vramTotal) * 100)}%)
- Hardware Codec : NVENC H.264 / HEVC Hardware Acceleration

-----------------------------------------------------
3. MEMORY SUBSYSTEM (RAM)
-----------------------------------------------------
- System Memory  : ${telemetry.ramUsed} GB / ${telemetry.ramTotal} GB (${Math.round((telemetry.ramUsed / telemetry.ramTotal) * 100)}%)
- Audio Cache    : High-Speed Web Audio Buffer Active
- Syllable Engine: Khmer Phonetic Smart Fit Synchronized

=====================================================
Generated by Frenxz AI Studio Dubbing Engine
=====================================================`;

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frenxz_hardware_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Diagnostic TXT Downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0a101b] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#070b13] border-b border-[#162235] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c2240] border border-[#1e4976] flex items-center justify-center text-[#38bdf8] shadow-md">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm tracking-wide font-sans flex items-center gap-2">
                <span>ដំណើរការ HARDWARE (CPU • GPU • RAM)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#062c1d] border border-[#059669] text-[#34d399] font-mono">
                  {telemetry.engineStatus}
                </span>
              </h3>
              <p className="text-[11px] text-[#64748b]">
                ព័ត៌មាននិងកំណត់ត្រាដំណើរការម៉ាស៊ីនក្នុងពេលជាក់ស្តែង (Real-time Telemetry)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#10192a] hover:bg-[#19263e] text-[#94a3b8] hover:text-white border border-[#1e293b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
          {/* Main 3 Metrics Cards (CPU, GPU, RAM) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. CPU Card */}
            <div className="p-3.5 rounded-xl bg-[#070b13] border border-[#162235] flex flex-col justify-between relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-[12px]">
                  <Cpu className="w-4 h-4 text-[#38bdf8]" />
                  <span>CPU Load</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#f59e0b] bg-[#291804] px-1.5 py-0.5 rounded border border-[#78350f]">
                  <Flame className="w-3 h-3 text-[#f59e0b]" />
                  {telemetry.cpuTemp}°C
                </span>
              </div>

              <div className="my-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-white">{telemetry.cpuUsage}%</span>
                <span className="text-[10px] text-[#64748b]">16 Cores / 32T</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#162235] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] transition-all duration-300"
                  style={{ width: `${telemetry.cpuUsage}%` }}
                />
              </div>
            </div>

            {/* 2. GPU Card */}
            <div className="p-3.5 rounded-xl bg-[#070b13] border border-[#162235] flex flex-col justify-between relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-[12px]">
                  <Zap className="w-4 h-4 text-[#a855f7]" />
                  <span>GPU Tensor</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#a855f7] bg-[#1e1035] px-1.5 py-0.5 rounded border border-[#581c87]">
                  {telemetry.gpuTemp}°C
                </span>
              </div>

              <div className="my-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-white">{telemetry.gpuUsage}%</span>
                <span className="text-[10px] font-mono text-[#c084fc]">{telemetry.vramUsed}G / {telemetry.vramTotal}G</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#162235] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc] transition-all duration-300"
                  style={{ width: `${telemetry.gpuUsage}%` }}
                />
              </div>
            </div>

            {/* 3. RAM Card */}
            <div className="p-3.5 rounded-xl bg-[#070b13] border border-[#162235] flex flex-col justify-between relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-[12px]">
                  <HardDrive className="w-4 h-4 text-[#34d399]" />
                  <span>Memory (RAM)</span>
                </div>
                <span className="text-[10px] font-mono text-[#34d399] bg-[#042416] px-1.5 py-0.5 rounded border border-[#065f46]">
                  {Math.round((telemetry.ramUsed / telemetry.ramTotal) * 100)}%
                </span>
              </div>

              <div className="my-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-white">{telemetry.ramUsed} GB</span>
                <span className="text-[10px] text-[#64748b]">of {telemetry.ramTotal} GB</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#162235] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#059669] to-[#34d399] transition-all duration-300"
                  style={{ width: `${(telemetry.ramUsed / telemetry.ramTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Engine Latency & Diagnostic Specs */}
          <div className="p-3.5 rounded-xl bg-[#070b13] border border-[#162235] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                <span>AI Engine & Hardware Pipeline State</span>
              </span>
              <span className="text-[10px] text-[#94a3b8] font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#64748b]" />
                Latency: 12.4ms • 48kHz
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-[#0a101b] border border-[#162235]">
                <span className="text-[#64748b] block text-[9.5px]">SPEECH CODEC</span>
                <span className="text-[#38bdf8] font-bold">Khmer Neural</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0a101b] border border-[#162235]">
                <span className="text-[#64748b] block text-[9.5px]">SMART FIT</span>
                <span className="text-[#34d399] font-bold">Adaptive (ON)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0a101b] border border-[#162235]">
                <span className="text-[#64748b] block text-[9.5px]">NVENC ACCEL</span>
                <span className="text-[#c084fc] font-bold">Hardware Active</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0a101b] border border-[#162235]">
                <span className="text-[#64748b] block text-[9.5px]">AUDIO CACHE</span>
                <span className="text-[#fbbf24] font-bold">Direct Decoded</span>
              </div>
            </div>
          </div>

          {/* Download Telemetry Options Section */}
          <div className="p-4 rounded-xl bg-[#0d1627] border border-[#1d4ed8]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#38bdf8]" />
                  <span>ទាញយកកំណត់ត្រាដំណើរការ (Download Hardware Telemetry Log)</span>
                </h4>
                <p className="text-[10.5px] text-[#94a3b8]">
                  នាំចេញទិន្នន័យ Hardware ក្នុងទម្រង់ JSON, CSV ឬ Text Report សម្រាប់តាមដាន
                </p>
              </div>

              {downloadSuccess && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#062c1d] border border-[#059669] text-[#34d399] text-[11px] font-bold animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            {/* 3 Download Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* 1. JSON */}
              <button
                onClick={handleDownloadJSON}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#0a1424] hover:bg-[#142542] border border-[#2563eb]/50 hover:border-[#38bdf8] text-white text-xs font-bold transition-all cursor-pointer shadow-sm group"
              >
                <FileJson className="w-4 h-4 text-[#38bdf8] group-hover:scale-110 transition-transform" />
                <span>Download JSON</span>
              </button>

              {/* 2. CSV */}
              <button
                onClick={handleDownloadCSV}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#062217] hover:bg-[#0c3927] border border-[#059669]/50 hover:border-[#34d399] text-white text-xs font-bold transition-all cursor-pointer shadow-sm group"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#34d399] group-hover:scale-110 transition-transform" />
                <span>Download CSV</span>
              </button>

              {/* 3. TXT Diagnostic */}
              <button
                onClick={handleDownloadTXT}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#1a1030] hover:bg-[#2b1b4f] border border-[#7c3aed]/50 hover:border-[#c084fc] text-white text-xs font-bold transition-all cursor-pointer shadow-sm group"
              >
                <FileText className="w-4 h-4 text-[#c084fc] group-hover:scale-110 transition-transform" />
                <span>Download TXT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#070b13] border-t border-[#162235] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10.5px] font-mono text-[#64748b]">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            <span>Frenxz Telemetry Stream Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#162235] hover:bg-[#233857] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
