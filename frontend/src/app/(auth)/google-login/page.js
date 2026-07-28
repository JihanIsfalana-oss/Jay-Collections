'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleLoginCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      // Mengirimkan code ke API Express.js
      fetch('http://localhost:5000/api/auth/google-login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          localStorage.setItem('token', data.data.token);
          router.push('/dashboard'); // Redirect ke dashboard setelah sukses
        } else {
          alert('Login gagal: ' + data.message);
          router.push('/login');
        }
      })
      .catch((err) => {
        console.error('Error saat menghubungi backend:', err);
        router.push('/login');
      });
    }
  }, [code, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center space-y-4 bg-white p-8 rounded-xl shadow-md max-w-sm w-full text-center">
        {/* Spinner Loading Animasi */}
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-semibold text-gray-800">Autentikasi Google</h2>
        <p className="text-gray-500 text-sm animate-pulse">
          Sedang memproses akun Anda, mohon tunggu beberapa saat...
        </p>
      </div>
    </div>
  );
}

export default function GoogleLoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Memuat halaman...</p>
      </div>
    }>
      <GoogleLoginCallbackContent />
    </Suspense>
  );
}
