import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check } from 'lucide-react';

export default function NetworkUrlDisplay() {
  const [ipAddress, setIpAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [networkUrl, setNetworkUrl] = useState('');

  useEffect(() => {
    // Try to get IP address from various sources
    const getIPAddress = async () => {
      try {
        // Method 1: Use WebRTC to get local IP (works in browsers)
        const RTCPeerConnection = window.RTCPeerConnection || 
                                   window.mozRTCPeerConnection || 
                                   window.webkitRTCPeerConnection;
        
        if (RTCPeerConnection) {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          
          pc.createDataChannel('');
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const candidate = event.candidate.candidate;
              const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
              if (match && match[1] && !match[1].startsWith('127.')) {
                const ip = match[1];
                setIpAddress(ip);
                setNetworkUrl(`http://${ip}:3000`);
                pc.close();
              }
            }
          };
          
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(() => {});
        }
      } catch (e) {
        console.log('Could not get IP via WebRTC');
      }
    };

    getIPAddress();
  }, []);

  const copyToClipboard = () => {
    if (networkUrl) {
      navigator.clipboard.writeText(networkUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!ipAddress) {
    return (
      <div style={{
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '0.9rem',
        color: '#64748b'
      }}>
        <Globe size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
        <strong>Network Access:</strong> Check terminal for "On Your Network" URL after starting server
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
      borderRadius: '8px',
      border: '2px solid #3b82f6',
      fontSize: '0.95rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Globe size={20} style={{ color: '#3b82f6' }} />
        <strong style={{ color: '#1e40af' }}>Network Access URL:</strong>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'white',
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid #93c5fd',
        fontFamily: 'monospace',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#1e40af'
      }}>
        <span style={{ flex: 1 }}>{networkUrl}</span>
        <button
          onClick={copyToClipboard}
          style={{
            padding: '6px 12px',
            background: copied ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          title="Copy URL"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#1e40af', opacity: 0.8 }}>
        Use this URL on other devices connected to the same Wi-Fi network
      </div>
    </div>
  );
}

