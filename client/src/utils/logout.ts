// Utility function to handle user logout
export const logout = async () => {
  try {
    // Call the logout API to clear server session
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error logging out from server:', error);
  }
  
  // Clear all localStorage data
  localStorage.clear();
  
  // Clear sessionStorage as well
  sessionStorage.clear();
  
  // Dispatch logout event for other components
  window.dispatchEvent(new CustomEvent('userLoggedOut'));
  
  // Reload the page to ensure clean state
  window.location.reload();
};