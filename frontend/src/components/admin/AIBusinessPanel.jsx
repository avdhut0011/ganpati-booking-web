import React, { useEffect, useState, useCallback } from 'react';
import { getAIInsights, askAIQuery, getAIStatus, saveAIApiKey } from '../../api/adminApi';
import LoadingSpinner from '../shared/LoadingSpinner';
import Alert from '../shared/Alert';

const AIBusinessPanel = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // AI Query Chat State
  const [userQuery, setUserQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // API Key Config State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState({ configured: false, keyMasked: '' });
  const [keyMessage, setKeyMessage] = useState(null);
  const [keySaving, setKeySaving] = useState(false);

  // Copied alert state
  const [copied, setCopied] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAIInsights();
      if (data && data.success) {
        setInsights(data);
      } else {
        setError('माहिती लोड करता आली नाही.');
      }
    } catch (e) {
      console.error("Fetch AI insights error:", e);
      setError('AI ॲनालिटिक्स लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKeyStatus = useCallback(async () => {
    try {
      const res = await getAIStatus();
      if (res) {
        setKeyStatus(res);
      }
    } catch (e) {
      console.error("Fetch API key status error:", e);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    fetchKeyStatus();
  }, [fetchInsights, fetchKeyStatus]);

  const handleSendQuery = async (queryText) => {
    const q = (queryText || userQuery).trim();
    if (!q) return;

    setQueryLoading(true);
    const newEntry = { query: q, answer: '', source: '', loading: true };
    setChatHistory(prev => [newEntry, ...prev]);
    setUserQuery('');

    try {
      const res = await askAIQuery(q);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[0] = {
          query: q,
          answer: res.answer || 'माहिती मिळाली नाही.',
          source: res.source,
          loading: false
        };
        return updated;
      });
    } catch (e) {
      console.error("AI Query error:", e);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[0] = {
          query: q,
          answer: 'क्षमस्व, उत्तर मिळवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
          source: 'error',
          loading: false
        };
        return updated;
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    setKeySaving(true);
    setKeyMessage(null);
    try {
      const res = await saveAIApiKey(apiKeyInput);
      if (res && res.success) {
        setKeyMessage({ type: 'success', text: res.message });
        setKeyStatus({ configured: res.configured, keyMasked: apiKeyInput ? 'Configured' : '' });
        setTimeout(() => {
          setShowKeyModal(false);
          setKeyMessage(null);
          setApiKeyInput('');
          fetchInsights();
        }, 1500);
      }
    } catch (e) {
      setKeyMessage({ type: 'error', text: e.response?.data?.detail || 'API Key सेव्ह करताना त्रुटी आली.' });
    } finally {
      setKeySaving(false);
    }
  };

  const copyDailyReport = () => {
    if (!insights?.dailyReportWhatsapp) return;
    navigator.clipboard.writeText(insights.dailyReportWhatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareDailyReportWhatsapp = () => {
    if (!insights?.dailyReportWhatsapp) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(insights.dailyReportWhatsapp)}`;
    window.open(url, '_blank');
  };

  const sendPaymentReminderWhatsapp = (cust) => {
    const text = 
      `🚩 *${insights?.metrics?.stallName || 'स्टॉल'} - बाकी रक्कम आठवण मेसेज* 🚩\n\n` +
      `नमस्कार *${cust.customerName}* जी,\n` +
      `आपल्या गणपती बाप्पा बुकिंग (मूर्ती क्र. *${cust.statueNumber}*) ची उर्वरित बाकी रक्कम *₹${cust.balanceAmount.toLocaleString('en-IN')}* जमा करणे बाकी आहे.\n\n` +
      `📌 *एकूण रक्कम:* ₹${cust.totalAmount.toLocaleString('en-IN')}\n` +
      `⏳ *शिल्लक बाकी:* ₹${cust.balanceAmount.toLocaleString('en-IN')}\n\n` +
      `मूर्ती नेण्यापूर्वी कृपया हे पेमेंट जमा करून सहकार्य करावे.\n` +
      `🚩 *॥ गणपती बाप्पा मोरया ॥* 🚩`;
    
    const url = `https://api.whatsapp.com/send?phone=91${cust.mobileNumber}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const suggestionChips = [
    "आजचे एकूण संकलन किती?",
    "सर्वात जास्त बाकी कोणाकडे आहे?",
    "रोख आणि UPI चे प्रमाण काय आहे?",
    "कोणत्या सह-मालकाने सर्वाधिक व्यवसाय केला?",
    "पुढील ३ दिवसांची बाकी वसुली रणनीती काय असावी?"
  ];

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <LoadingSpinner text="🤖 AI व्यवसाय विश्लेषण तयार होत आहे..." />
      </div>
    );
  }

  if (error || !insights) {
    return <div className="alert alert-error">{error || 'माहिती उपलब्ध नाही'}</div>;
  }

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    const parseLineSpans = (str, keyPrefix) => {
      const parts = [];
      const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(str.substring(lastIndex, match.index));
        }
        const token = match[0];
        if (token.startsWith('`') && token.endsWith('`')) {
          parts.push(
            <span key={`${keyPrefix}-${match.index}`} style={{
              background: 'var(--primary-subtle)', border: '1px solid var(--border)', padding: '1px 6px',
              borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px',
              color: 'var(--primary-dark)', fontWeight: 'bold'
            }}>
              {token.slice(1, -1)}
            </span>
          );
        } else if (token.startsWith('**') && token.endsWith('**')) {
          parts.push(
            <strong key={`${keyPrefix}-${match.index}`} style={{ color: 'var(--text-main)', fontWeight: '700' }}>
              {token.slice(2, -2)}
            </strong>
          );
        } else if (token.startsWith('*') && token.endsWith('*')) {
          parts.push(
            <strong key={`${keyPrefix}-${match.index}`} style={{ color: 'var(--text-main)', fontWeight: '700' }}>
              {token.slice(1, -1)}
            </strong>
          );
        }
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < str.length) {
        parts.push(str.substring(lastIndex));
      }

      return parts.length > 0 ? parts : str;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)' }}>
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lIdx} style={{ height: '4px' }} />;
          }

          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed);
          const isEmojiHeader = trimmed.startsWith('🚩') || trimmed.startsWith('📊') || trimmed.startsWith('🎯') || trimmed.startsWith('💳') || trimmed.startsWith('📅') || trimmed.startsWith('⚠️') || trimmed.startsWith('💡') || trimmed.startsWith('📌');

          if (isBullet) {
            return (
              <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: trimmed.startsWith('•') ? '10px' : '4px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                <div style={{ flex: 1 }}>
                  {parseLineSpans(trimmed.replace(/^[•\-]\s*/, ''), lIdx)}
                </div>
              </div>
            );
          }

          return (
            <div key={lIdx} style={{ fontWeight: isEmojiHeader ? '700' : 'normal', color: isEmojiHeader ? 'var(--secondary)' : 'inherit' }}>
              {parseLineSpans(trimmed, lIdx)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* COPILOT HEADER BANNER */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--secondary) 0%, #220B29 100%)', 
        color: '#FFFFFF', 
        borderRadius: 'var(--radius-lg)', 
        padding: '28px 24px', 
        border: '1px solid rgba(243, 168, 59, 0.25)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(212, 136, 26, 0.2)', border: '1px solid rgba(212, 136, 26, 0.4)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '11.5px', fontWeight: 700, color: '#F8DFAC', textTransform: 'uppercase', marginBottom: '8px' }}>
              <i className="fa-solid fa-brain"></i>
              <span>Intelligent Business Advisor</span>
            </div>
            <h2 style={{ margin: '0 0 6px 0', color: '#FFFFFF', fontSize: '22px', fontWeight: 800 }}>
              AI व्यवसाय विश्लेषण व स्मार्ट अंतर्दृष्टी
            </h2>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '13.5px', lineHeight: '1.5' }}>
              Google Gemini 1.5 Flash द्वारे संकलन गती अंदाज, वसुली रणनीती व दैनिक व्यवसाय विश्लेषण.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: insights.isAiPowered ? 'rgba(5, 150, 105, 0.25)' : 'rgba(217, 119, 6, 0.25)',
              border: `1.5px solid ${insights.isAiPowered ? 'var(--success-border)' : 'var(--warning-border)'}`,
              color: '#FFFFFF', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 700
            }}>
              {insights.isAiPowered ? '🟢 Gemini 1.5 Flash Live' : '⚡ Offline Smart Engine'}
            </span>
            <button 
              className="btn btn-sm" 
              onClick={() => setShowKeyModal(true)}
              style={{ background: '#FFFFFF', color: 'var(--secondary)', fontWeight: 700, border: 'none' }}
            >
              <i className="fa-solid fa-key" style={{ color: 'var(--primary)' }}></i>
              <span>{keyStatus.configured ? 'API Key बदला' : '🔑 Gemini Key जोडा'}</span>
            </button>
          </div>
        </div>

        {/* HEALTH SCORE GAUGE BANNER */}
        <div style={{
          marginTop: '20px', padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#F8DFAC', fontWeight: 700, textTransform: 'uppercase' }}>व्यवसाय संकलन स्थिती (Health Index)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px' }}>
              {insights.healthLabel}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#F8DFAC', fontWeight: 700, textTransform: 'uppercase' }}>कलेक्शन दर</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-gold)', marginTop: '2px' }}>
              {insights.metrics.collectionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* API KEY CONFIGURATION MODAL */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-key" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                Google Gemini 1.5 Flash API Key
              </h3>
              <button 
                type="button" 
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Google AI Studio मधून मोफत Gemini API Key मिळवून येथे सेव्ह करा.
              </p>

              {keyMessage && <Alert type={keyMessage.type} message={keyMessage.text} onClose={() => setKeyMessage(null)} />}

              <form onSubmit={handleSaveKey}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Gemini API Key</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="उदा. AIzaSy..." 
                    value={apiKeyInput} 
                    onChange={e => setApiKeyInput(e.target.value)} 
                  />
                  <small style={{ color: 'var(--text-subtle)', marginTop: '4px', display: 'block', fontSize: '11.5px' }}>
                    सध्याची स्थिती: {keyStatus.configured ? '✅ जोडलेली आहे' : '❌ जोडलेली नाही'}
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '12.5px', color: 'var(--info)', fontWeight: 600 }}
                  >
                    🔗 मोफत Key मिळवा (Google AI Studio)
                  </a>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm" 
                      onClick={() => setShowKeyModal(false)}
                    >
                      रद्द करा
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm" 
                      disabled={keySaving}
                    >
                      {keySaving ? 'तपासत आहे...' : 'सेव्ह करा'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE SUMMARY & KEY HIGHLIGHTS */}
      <div className="grid-2">
        {/* EXECUTIVE SUMMARY */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--primary)' }}></i>
              <span>AI व्यवसाय सारांश (Executive Summary)</span>
            </h3>
            <button className="btn btn-outline btn-sm" onClick={fetchInsights} title="ताजे विश्लेषण मिळवा">
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
          <p style={{ fontSize: '14.5px', lineHeight: '1.7', color: 'var(--text-main)', fontWeight: 500 }}>
            {insights.executiveSummary}
          </p>
        </div>

        {/* KEY HIGHLIGHTS & BULLETS */}
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-lightbulb" style={{ color: 'var(--secondary)' }}></i>
              <span>ठळक अंतर्दृष्टी व सूचना (Key Takeaways)</span>
            </h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(insights.highlights || []).map((h, idx) => (
              <li key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-main)', fontWeight: 500 }}>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* INTERACTIVE "AI ला विचारा" (CHAT / COPILOT BAR) */}
      <div className="card" style={{ border: '1.5px solid var(--border)', background: '#FFFFFF' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <i className="fa-solid fa-comments" style={{ color: 'var(--primary)' }}></i>
              <span>AI ला विचारा (Ask AI Copilot)</span>
            </h3>
            <p className="card-subtitle">स्टॉलच्या व्यवसायाबाबत कोणताही प्रश्न मराठी, इंग्रजी किंवा मिंग्लिशमध्ये विचारा</p>
          </div>
        </div>

        {/* QUERY INPUT FORM */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div className="input-icon-wrap" style={{ flex: 1 }}>
            <i className="fa-solid fa-message input-icon"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder="उदा. आजचे संकलन किती? किंवा सर्वात जास्त बाकी कोणाकडे आहे?" 
              value={userQuery} 
              onChange={e => setUserQuery(e.target.value)}
              style={{ fontSize: '14.5px' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={queryLoading || !userQuery.trim()}
            style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
          >
            {queryLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> शोधत आहे...</> : <><i className="fa-solid fa-paper-plane"></i> विचारा</>}
          </button>
        </form>

        {/* SUGGESTION PROMPT PILLS */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 700 }}>💡 सुचवलेले प्रश्न:</span>
          {suggestionChips.map((chip, idx) => (
            <button 
              key={idx} 
              type="button" 
              onClick={() => handleSendQuery(chip)}
              disabled={queryLoading}
              style={{
                background: 'var(--surface-subtle)', border: '1px solid var(--border)',
                color: 'var(--text-main)', padding: '5px 12px',
                borderRadius: 'var(--radius-full)', fontSize: '12px', cursor: 'pointer',
                fontWeight: 600, transition: 'var(--transition)'
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* CHAT RESULTS THREAD */}
        {chatHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            {chatHistory.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                  <i className="fa-solid fa-circle-question"></i>
                  <span>प्रश्न: {item.query}</span>
                </div>
                
                {item.loading ? (
                  <div style={{ color: 'var(--secondary)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>AI उत्तर तयार करत आहे...</span>
                  </div>
                ) : (
                  <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--success)', boxShadow: 'var(--shadow-xs)' }}>
                    {renderFormattedText(item.answer)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SMART ACTIONS: DAILY WHATSAPP REPORT & BALANCE RECOVERY */}
      <div className="grid-2">
        {/* 1-CLICK DAILY WHATSAPP REPORT */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i>
                <span>दैनिक व्यवसाय अहवाल (Daily Report)</span>
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={copyDailyReport} 
              >
                <i className="fa-solid fa-copy"></i>
                <span>{copied ? 'कॉपी झाले! ✅' : 'कॉपी करा'}</span>
              </button>
              <button 
                className="btn btn-whatsapp btn-sm" 
                onClick={shareDailyReportWhatsapp} 
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>शेअर</span>
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '16px'
          }}>
            {renderFormattedText(insights.dailyReportWhatsapp)}
          </div>
        </div>

        {/* PENDING BALANCE RECOVERY ALERTS */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--warning-dark)' }}></i>
                <span>बाकी रक्कम वसुली अलर्ट (Top Pending Dues)</span>
              </h3>
              <p className="card-subtitle">१-क्लिकमध्ये WhatsApp पेमेंट आठवण मेसेज पाठवा</p>
            </div>
          </div>

          {(!insights.topPending || insights.topPending.length === 0) ? (
            <div style={{ color: 'var(--success-dark)', fontWeight: 600, padding: '20px 0', textAlign: 'center' }}>
              🎉 कोणत्याही ग्राहकाकडे मोठी बाकी रक्कम शिल्लक नाही!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ग्राहक व मूर्ती क्र.</th>
                    <th>बाकी रक्कम</th>
                    <th style={{ textAlign: 'center' }}>कृती (Action)</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topPending.map((cust, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{cust.customerName}</strong><br/>
                        <small style={{ color: 'var(--text-muted)' }}>मूर्ती: <strong>{cust.statueNumber}</strong> • 📞 {cust.mobileNumber}</small>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontSize: '14px' }}>
                          ₹{cust.balanceAmount.toLocaleString('en-IN')}
                        </strong><br/>
                        <small style={{ color: 'var(--text-subtle)' }}>एकूण: ₹{cust.totalAmount.toLocaleString('en-IN')}</small>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-whatsapp btn-sm" 
                          onClick={() => sendPaymentReminderWhatsapp(cust)}
                          title="WhatsApp वर आठवण मेसेज पाठवा"
                        >
                          <i className="fa-brands fa-whatsapp"></i>
                          <span>आठवण पाठवा</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AIBusinessPanel;
