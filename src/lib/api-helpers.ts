import { createBrowserClient } from './supabase';

export async function apiCall(endpoint: string, method: 'GET' | 'POST', body?: any) {
  const { data: sessionData } = await createBrowserClient().auth.getSession();
  const token = sessionData.session?.access_token;
  
  if (!token) {
    throw new Error('Authentication error - please try signing in again');
  }
  
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `Failed to ${method.toLowerCase()} to ${endpoint}`);
  }
  
  return data;
}