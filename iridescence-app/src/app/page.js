'use client';
import { useState, useEffect } from 'react';
import Iridescence from '@/components/Iridescence/Iridescence';
import AudioRecorder from '@/components/AudioRecorder/AudioRecorder';
import styles from './page.module.css';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('Checking API...');

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setApiStatus(`${data.message} (${data.timestamp})`))
      .catch(err => setApiStatus('API Error: ' + err.message));
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.background}>
        <Iridescence 
          color={[1, 1, 1]} 
          mouseReact={true}
          amplitude={0.1}
          speed={1.0}
        />
      </div>
      <div className={styles.overlay}>
        <div className={styles.card}>
          <h1 className={styles.title}>Iridescence</h1>
          <AudioRecorder />
          <div className={styles.status}>
            API: {apiStatus}
          </div>
        </div>
      </div>
    </main>
  );
}
