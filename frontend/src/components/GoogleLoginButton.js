'use client';

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    const rootUrl = 'https://google.com';
    const options = {
      redirect_uri: 'http://localhost:3000/google-login', 
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: [
        'https://googleapis.com',
        'https://googleapis.com'
      ].join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    };

    const queryString = new URLSearchParams(options).toString();
    window.location.href = `${rootUrl}?${queryString}`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
      type="button"
    >
      <span>Masuk dengan Google</span>
    </button>
  );
}
