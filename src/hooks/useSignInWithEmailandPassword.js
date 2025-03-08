import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';

const useSignInWithEmailAndPasswordHook = () => {
  const [
    signInWithEmailAndPasswordFn,
    user,
    loading,
    error,
  ] = useSignInWithEmailAndPassword(auth);

  const signin = async (inputs) => {
    if (!inputs.email || !inputs.password) {
      console.log("Please fill in all fields");
      return;
    }
    
    try {
      const signedInUser = await signInWithEmailAndPasswordFn(inputs.email, inputs.password);
      if (signedInUser) {
        // Optionally, you might store user data in local storage
        localStorage.setItem("user-info", JSON.stringify(signedInUser.user));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { error, loading, signin, user };
};

export default useSignInWithEmailAndPasswordHook;
