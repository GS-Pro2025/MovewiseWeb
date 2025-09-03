
export interface LoginFormData {
    email: string;
    password: string;
  }
  
  export interface RegisterFormData {
    licenseNumber: string;
    name: string;
    address: string;
    postalCode: string;
  }
  
  export interface AuthResult {
    success: boolean;
    message: string;
  }
  
  export interface LoginFormProps {
    onForgotPassword: (email: string) => void;
  }
  
  export interface RegisterFormProps {
    onRegisterSuccess?: (data: RegisterFormData) => void;
  }
  
  export interface WelcomePanelProps {
    isFlipped: boolean;
    onFlip: (flipped: boolean) => void;
  }
  
  export interface ForgotPasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => Promise<void>;
    initialEmail?: string;
  }
  
  export interface SnackbarProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
  }