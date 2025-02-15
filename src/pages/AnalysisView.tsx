import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMarketAnalysis } from '../hooks/useMarketAnalysis';
import { useAuth } from '../hooks/useAuth';
import { User, TrendingUp, TrendingDown, ThumbsUp, Eye, ArrowLeft } from 'lucide-react';

export default function AnalysisView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { analyses, loading, toggleLike } = useMarketAnalysis();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!loading && analyses.length > 0) {
      const foundAnalysis = analyses.find(a => a.id === id);
      if (foundAnalysis) {
        setAnalysis(foundAnalysis);
      } else {
        navigate('/market-analysis');
      }
    }
  }, [id, analyses, loading, navigate]);

  const handleLike = async (analysisId: string) => {
    if (!user) return;
    await toggleLike(analysisId, user.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/market-analysis"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        العودة إلى التحليلات
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            {analysis.users_profile?.avatar_url ? (
              <img
                src={analysis.users_profile.avatar_url}
                alt={analysis.users_profile.full_name || ''}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{analysis.users_profile?.full_name || 'مستخدم مجهول'}</span>
              <span>•</span>
              <span>{new Date(analysis.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <span className="font-semibold text-gray-900 dark:text-white">{analysis.instrument}</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            analysis.direction === 'buy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
            analysis.direction === 'sell' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}>
            {analysis.direction === 'buy' ? 'شراء' :
             analysis.direction === 'sell' ? 'بيع' : 'تحليل'}
          </span>
        </div>

        {analysis.media_url && analysis.media_type === 'image' && (
          <div className="mb-6">
            <img
              src={analysis.media_url}
              alt={analysis.title}
              className="w-full rounded-lg object-contain max-h-[600px]"
            />
          </div>
        )}

        <div className="prose max-w-none mb-6">
          <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{analysis.content}</p>
        </div>

        {(analysis.stop_loss || analysis.take_profit) && (
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {analysis.stop_loss && (
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">وقف الخسارة</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{analysis.stop_loss}</p>
                </div>
              </div>
            )}
            {analysis.take_profit && (
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">الهدف</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{analysis.take_profit}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleLike(analysis.id)}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <ThumbsUp className="w-5 h-5" />
              <span>{analysis.likes_count || 0}</span>
            </button>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Eye className="w-5 h-5" />
              <span>{analysis.views_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}