/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  GraduationCap, 
  TrendingUp, 
  BarChart3, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  School,
  BookOpen,
  MapPin,
  User,
  Info,
  Briefcase,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService, UniversityScore, MajorScore } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'search' | 'evaluate' | 'recommend';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [uniScores, setUniScores] = useState<UniversityScore[]>([]);
  const [majorScores, setMajorScores] = useState<MajorScore[]>([]);

  // Evaluate State
  const [evalSchool, setEvalSchool] = useState('');
  const [evalScore, setEvalScore] = useState<number | ''>('');
  const [evalTrack, setEvalTrack] = useState<'理科' | '文科'>('理科');
  const [evalProvince, setEvalProvince] = useState('北京');
  const [evalResult, setEvalResult] = useState<any>(null);

  // Recommend State
  const [recScore, setRecScore] = useState<number | ''>('');
  const [recTrack, setRecTrack] = useState<'理科' | '文科'>('理科');
  const [recProvince, setRecProvince] = useState('北京');
  const [recResults, setRecResults] = useState<any[]>([]);

  // Major Interpretation State
  const [selectedMajor, setSelectedMajor] = useState<{ school: string, major: string } | null>(null);
  const [majorDetail, setMajorDetail] = useState<any>(null);
  const [majorLoading, setMajorLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [uScores, mScores] = await Promise.all([
        geminiService.searchUniversityScores(searchQuery),
        geminiService.searchMajorScores(searchQuery)
      ]);
      setUniScores(uScores);
      setMajorScores(mScores);
    } catch (err) {
      setError('查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!evalSchool || !evalScore) return;
    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.evaluateAdmissionProbability(
        evalSchool, 
        Number(evalScore), 
        evalTrack, 
        evalProvince
      );
      setEvalResult(result);
    } catch (err) {
      setError('评测失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (!recScore) return;
    setLoading(true);
    setError(null);
    try {
      const results = await geminiService.recommendUniversities(
        Number(recScore), 
        recTrack, 
        recProvince
      );
      setRecResults(results);
    } catch (err) {
      setError('推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMajorDetail = async (school: string, major: string) => {
    setSelectedMajor({ school, major });
    setMajorLoading(true);
    setMajorDetail(null);
    try {
      const detail = await geminiService.getMajorInterpretation(school, major);
      setMajorDetail(detail);
    } catch (err) {
      setError('获取专业解读失败');
    } finally {
      setMajorLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">高考志愿助手</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Gaokao AI Assistant</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {(['search', 'evaluate', 'recommend'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all",
                  activeTab === tab 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {tab === 'search' && '分数线查询'}
                {tab === 'evaluate' && '录取概率评测'}
                {tab === 'recommend' && '智能高校推荐'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <h2 className="text-3xl font-bold">院校及专业分数线查询</h2>
                <p className="text-gray-500">输入院校名称，查询2023-2025年全国一本及以上投档线和专业录取分数线</p>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="例如：清华大学、浙江大学..."
                    className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : '立即查询'}
                  </button>
                </div>
              </div>

              {uniScores.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* University Scores */}
                  <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2"><School size={18} className="text-blue-600" /> 院校投档线</h3>
                      <span className="text-xs text-gray-400 font-mono">LATEST 3 YEARS</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                            <th className="px-6 py-3">年份</th>
                            <th className="px-6 py-3">科类</th>
                            <th className="px-6 py-3">省份</th>
                            <th className="px-6 py-3 text-right">最低分</th>
                            <th className="px-6 py-3 text-right">最低位次</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {uniScores.map((score, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-6 py-4 font-medium">{score.year}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  score.track === '理科' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                )}>
                                  {score.track}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{score.province}</td>
                              <td className="px-6 py-4 text-right font-bold text-blue-600">{score.minScore}</td>
                              <td className="px-6 py-4 text-right text-gray-500 font-mono">{score.minRank?.toLocaleString() || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Major Scores */}
                  <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2"><BookOpen size={18} className="text-blue-600" /> 专业录取分数线</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                            <th className="px-6 py-3">年份</th>
                            <th className="px-6 py-3">专业名称</th>
                            <th className="px-6 py-3">科类</th>
                            <th className="px-6 py-3 text-right">最低分</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {majorScores.map((score, i) => (
                            <tr 
                              key={i} 
                              className="hover:bg-blue-50 transition-colors cursor-pointer group"
                              onClick={() => handleMajorDetail(score.schoolName, score.majorName)}
                            >
                              <td className="px-6 py-4 text-gray-500">{score.year}</td>
                              <td className="px-6 py-4 font-medium flex items-center gap-2">
                                {score.majorName}
                                <Info size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  score.track === '理科' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                )}>
                                  {score.track}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-blue-600">{score.minScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          )}

          {/* Evaluate Tab */}
          {activeTab === 'evaluate' && (
            <motion.div
              key="evaluate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg">录取概率评测</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">目标院校</label>
                      <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="输入学校名称"
                          value={evalSchool}
                          onChange={(e) => setEvalSchool(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">高考分数</label>
                      <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="number"
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="例如：650"
                          value={evalScore}
                          onChange={(e) => setEvalScore(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">科类</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={evalTrack}
                          onChange={(e) => setEvalTrack(e.target.value as any)}
                        >
                          <option value="理科">理科</option>
                          <option value="文科">文科</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">所在地</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={evalProvince}
                          onChange={(e) => setEvalProvince(e.target.value)}
                        >
                          {['北京', '上海', '广东', '浙江', '江苏', '山东', '四川', '湖北', '陕西', '河南'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleEvaluate}
                      disabled={loading || !evalSchool || !evalScore}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : '开始评测'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                {evalResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-2xl font-bold">{evalSchool}</h4>
                        <p className="text-gray-500">录取概率评测报告</p>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-full font-bold text-sm",
                        evalResult.riskLevel === '极低风险' ? "bg-green-50 text-green-600" :
                        evalResult.riskLevel === '低风险' ? "bg-blue-50 text-blue-600" :
                        evalResult.riskLevel === '中等风险' ? "bg-yellow-50 text-yellow-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {evalResult.riskLevel}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-gray-100"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={552.92}
                            strokeDashoffset={552.92 * (1 - evalResult.probability)}
                            className={cn(
                              "transition-all duration-1000 ease-out",
                              evalResult.probability > 0.8 ? "text-green-500" :
                              evalResult.probability > 0.5 ? "text-blue-500" :
                              evalResult.probability > 0.3 ? "text-yellow-500" :
                              "text-red-500"
                            )}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black">{(evalResult.probability * 100).toFixed(0)}%</span>
                          <span className="text-xs font-bold text-gray-400 uppercase">录取概率</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /> 智能分析建议</h5>
                      <div className="p-4 bg-gray-50 rounded-xl text-gray-700 leading-relaxed">
                        {evalResult.analysis}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                    <AlertCircle size={48} className="mb-4 opacity-20" />
                    <p>请输入信息并点击“开始评测”</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Recommend Tab */}
          {activeTab === 'recommend' && (
            <motion.div
              key="recommend"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">智能高校推荐</h2>
                  <p className="text-gray-500">基于您的分数和科类，AI为您精准推荐10所录取概率较高的院校</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">高考分数</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="输入分数"
                      value={recScore}
                      onChange={(e) => setRecScore(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">科类</label>
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                      {['理科', '文科'].map(t => (
                        <button
                          key={t}
                          onClick={() => setRecTrack(t as any)}
                          className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            recTrack === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">所在地</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={recProvince}
                      onChange={(e) => setRecProvince(e.target.value)}
                    >
                      {['北京', '上海', '广东', '浙江', '江苏', '山东', '四川', '湖北', '陕西', '河南'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleRecommend}
                  disabled={loading || !recScore}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : '获取AI推荐列表'}
                </button>
              </div>

              {recResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recResults.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50 transition-all cursor-default"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold group-hover:text-blue-600 transition-colors">{rec.schoolName}</h4>
                          <div className="flex flex-wrap gap-2">
                            {rec.tags?.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-blue-600">{(rec.estimatedProbability * 100).toFixed(0)}%</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase">预估概率</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {rec.reason}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <GraduationCap size={20} />
            <span className="font-bold">高考志愿助手</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400 font-medium">
            <a href="#" className="hover:text-blue-600 transition-colors">数据来源说明</a>
            <a href="#" className="hover:text-blue-600 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-blue-600 transition-colors">免责声明</a>
          </div>
          <p className="text-xs text-gray-400">© 2026 高考志愿填报指导系统. AI Generated Insights.</p>
        </div>
      </footer>

      {/* Major Detail Modal */}
      <AnimatePresence>
        {selectedMajor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMajor(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
                <div>
                  <h3 className="text-2xl font-bold">{selectedMajor.major}</h3>
                  <p className="text-blue-100 font-medium">{selectedMajor.school}</p>
                </div>
                <button 
                  onClick={() => setSelectedMajor(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {majorLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="text-gray-500 font-medium">AI 正在深度解读专业...</p>
                  </div>
                ) : majorDetail ? (
                  <div className="space-y-8">
                    <section className="space-y-3">
                      <h4 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                        <Info size={20} /> 专业概况与特色
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        {majorDetail.overview}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="space-y-3">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                          <BookOpen size={20} /> 核心课程
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {majorDetail.courses.map((course: string) => (
                            <span key={course} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-200">
                              {course}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                          <Briefcase size={20} /> 就业方向
                        </h4>
                        <ul className="space-y-2">
                          {majorDetail.careerPaths.map((path: string) => (
                            <li key={path} className="flex items-center gap-2 text-gray-700 text-sm">
                              <CheckCircle2 size={14} className="text-green-500" />
                              {path}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="space-y-3">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                          <TrendingUp size={20} /> 薪资水平预估
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {majorDetail.salaryExpectation}
                        </p>
                      </section>

                      <section className="space-y-3">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-blue-600">
                          <GraduationCap size={20} /> 深造建议
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {majorDetail.furtherStudy}
                        </p>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400">
                    获取解读失败，请重试
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setSelectedMajor(null)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
