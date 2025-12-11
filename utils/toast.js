const toastConfig = {
  success: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: '#22c55e',
    textColor: '#166534',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
    textColor: '#991b1b',
  },
  warning: {
    backgroundColor: '#fffbeb',
    borderLeftColor: '#f59e0b',
    textColor: '#92400e',
  },
  default: {
    backgroundColor: '#f8fafc',
    borderLeftColor: '#94a3b8',
    textColor: '#1e293b',
  },
};

// Direct toast functions that can be used anywhere
export const showToast = (message, type = 'default', duration = 4000) => {
  const { toast } = require('@backpackapp-io/react-native-toast');
  
  const config = toastConfig[type] || toastConfig.default;
  
  toast(message, {
    duration,
    styles: {
      view: {
        padding: 16,
        margin: 3,
        borderRadius: 8,
        backgroundColor: config.backgroundColor,
        borderLeftWidth: 4,
        borderLeftColor: config.borderLeftColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignSelf: 'center',
      
      },
      text: {
        color: config.textColor,
        fontFamily: 'Quicksand-Medium',
        fontSize: 14,
        textAlign: 'center',
        flexWrap: 'wrap', // Allow text to wrap
       
      },
    },
  });
};

export const showSuccess = (message, duration) => 
  showToast(message, 'success', duration);

export const showError = (message, duration) => 
  showToast(message, 'error', duration);

export const showWarning = (message, duration) => 
  showToast(message, 'warning', duration);

// Hook version for components
export const useToast = () => ({
  showToast,
  showSuccess,
  showError,
  showWarning,
});
