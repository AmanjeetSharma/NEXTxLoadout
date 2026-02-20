import { createContext, useContext, useEffect, useState, useRef } from "react";
import axiosInstance from "../utils/axiosInstance.js";
import { toast } from "react-hot-toast";
import '../App.css';

const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    const isFirstFetch = useRef(true);// Track if it's the first fetch to avoid showing error on initial load

    const fetchProfile = async () => {
        try {
            const res = await axiosInstance.get("user/profile");
            setUser(res.data.data);
        } catch (err) {
            if (!isFirstFetch.current) {
                if (err.response?.status !== 401) {
                    console.error("❌ Failed to fetch profile:", err);
                    toast.error(err?.response?.data?.message || "Failed to fetch profile");
                }
            }
            setUser(null);
        } finally {
            setLoading(false);
            // After first fetch, mark as false
            isFirstFetch.current = false;
        }
    };

    const fetchProducts = async (page = 1) => {
        try {
            setProductsLoading(true);
            const res = await axiosInstance.get(`/products?page=${page}`);

            // Handle both response shapes safely
            const productsData = res.data?.data?.products || res.data?.data || [];
            const totalPagesData = res.data?.data?.totalPages || res.data?.totalPages || 1;

            setProducts(productsData);
            setTotalPages(totalPagesData);
        } catch (error) {
            console.error("❌ Failed to fetch products:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch products");
        } finally {
            setProductsLoading(false);
        }
    };




    useEffect(() => {
        fetchProfile();
    }, []);






    const register = async (formData) => {
        try {
            await axiosInstance.post("auth/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Registration successful! Please login.");
        } catch (err) {
            console.error("❌ Register error:", err);
            const msg = err?.response?.data?.message || "Register failed";
            toast.error(msg, { duration: 4000 });
            throw err;
        }
    };




    const login = async (data) => {
        try {
            const res = await axiosInstance.post("auth/login", data);
            await fetchProfile(); // Will refresh user's profile after login
            toast.success("Login successful!", { duration: 3000, position: "bottom-left" });
        } catch (err) {
            console.error("❌ Login error:", err);
            const msg = err?.response?.data?.message || "Login failed";
            toast.custom((t) => (
                <div
                    onClick={() => toast.dismiss(t.id)}
                    className="my-toast my-toast-error"
                >
                    {msg}
                </div>
            ), {
                duration: 6000,
                position: "bottom-left",
            });
            throw err;
        }
    };

    const loginWithGoogle = async (tokenId, device) => {
        try {
            const res = await axiosInstance.post("oauth2/google-login", { tokenId, device });
            await fetchProfile();
            toast.success("Google login successful!", { duration: 3000, position: "bottom-left" });
        } catch (err) {
            console.error("❌ Google login error:", err);
            const msg = err?.response?.data?.message || "Google login failed";
            toast.error(msg, { duration: 3000, position: "bottom-left" });
            throw err;
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post("auth/logout");
            setUser(null);
            toast.success("Logged out successfully", { duration: 3000, position: "bottom-left" });
        } catch (err) {
            console.error("❌ Logout error:", err);
            toast.error("Logout failed");
        }
    };





    const updateProfile = async (data) => {
        try {
            const res = await axiosInstance.patch("user/update-profile", data);
            setUser(res.data.data);
            toast.success("Profile updated successfully!");
        } catch (err) {
            console.error("❌ Update profile error:", err);
            const msg = err?.response?.data?.message || "Update failed";
            toast.error(msg, { duration: 3000 });
            throw err;
        }
    };







    const deleteAccount = async () => {
        try {
            await axiosInstance.delete("user/delete-account");
            setUser(null);
            toast.success("Account deleted successfully!");
        } catch (err) {
            console.error("❌ Delete account error:", err);
            toast.error("Account deletion failed");
            throw err;
        }
    };






    const changePassword = async (data) => {
        try {
            await axiosInstance.patch("user/change-password", data);
            toast.success("Password changed successfully. Please log in again.");
            await logout();
        } catch (err) {
            console.error("❌ Change password error:", err);
            const msg = err?.response?.data?.message || "Password change failed";
            toast.error(msg);
            throw err;
        }
    };






    const getSessions = async () => {
        try {
            const res = await axiosInstance.get("user/sessions");
            return res.data.data;
        } catch (err) {
            console.error("❌ Fetch sessions error:", err);
            toast.error("Failed to fetch sessions");
            return [];
        }
    };






    const logoutAllSessions = async () => {
        try {
            await axiosInstance.post("auth/logout-all");
            toast.success("Logged out from all sessions successfully");
            setUser(null);
        } catch (err) {
            console.error("❌ Logout all error:", err);
            toast.error(err?.response?.data?.message || "Failed to logout from all sessions");
        }
    };








    const forgotPassword = async (email) => {
        try {
            await axiosInstance.post("auth/forgot-password", { email });
            toast.custom(() => (
                <div className="my-toast my-toast-info">
                    📧 An email has been sent to {email}
                </div>
            ), {
                duration: 5000,
                position: "bottom-center",
            });
        } catch (err) {
            console.error("Forgot password error:", err);
            toast.error(err?.response?.data?.message || "Failed to send reset email");
            throw err;
        }
    };


    const resetPassword = async ({ token, newPassword, confirmPassword }) => {
        try {
            await axiosInstance.post("/auth/reset-password", {
                token,
                newPassword,
                confirmPassword,
            });
            toast.success("Password has been reset successfully. Please login with your new password.");
        } catch (err) {
            console.error("Reset password error:", err);
            toast.error(err?.response?.data?.message || "Failed to reset password");
            throw err;
        }
    };





    const askAI = async (input) => {
        try {
            // console.log("🧠 Asking AI:", prompt);
            const res = await axiosInstance.post("/ai/askAi", { input });
            return res.data.response;
        } catch (err) {
            console.error("AI request failed:", err);
            throw err;
        }
    };







    const sendVerificationEmail = async () => {
        try {
            console.log("reached till auth context sendVerificationEmail");
            const res = await axiosInstance.post(`user/send-verification/${user._id}`);
            return res.data.message;
        } catch (error) {
            console.error("❌ Error sending verification email:", error);
            throw error;
        }
    };









    const fetchProductBySlug = async (slug) => {
        try {
            const res = await axiosInstance.get(`/products/${slug}`);
            return res.data.data;
        } catch (error) {
            console.error("Failed to fetch product by slug", error);
            throw error;
        }
    };







    const addOrUpdateReview = async (slug, rating, comment) => {
        try {
            const response = await axiosInstance.post(`/products/${slug}/reviews`, {
                rating,
                comment
            });
            toast.success("Review submitted");
            return response.data;
        } catch (error) {
            toast.error("Failed to submit review");
            throw error.response?.data?.message || error.message;
        }
    };




    const deleteReview = async (slug) => {
        try {
            const response = await axiosInstance.delete(`/products/${slug}/reviews/delete`);
            console.log("Review deleted successfully:", response.data);
            toast.success("Review deleted successfully!");
            return response.data;
        } catch (error) {
            toast.error("Failed to delete review");
            throw error.response?.data?.message || error.message;
        }
    };





    const getAllReviews = async (slug) => {
        try {
            const response = await axiosInstance.get(`/products/${slug}/reviews`);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    };













    const createProduct = async (productData, images) => {
        try {
            const formData = new FormData();
            Object.entries(productData).forEach(([key, value]) => {
                if (key === 'specs') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            });

            if (images) {
                images.forEach(image => {
                    formData.append('productImages', image);
                });
            }

            await axiosInstance.post('/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    };




    const updateProduct = async (productId, productData, images) => {
        try {
            const formData = new FormData();
            Object.entries(productData).forEach(([key, value]) => {
                if (key === 'specs') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            });

            if (images) {
                images.forEach(image => {
                    formData.append('productImages', image);
                });
            }

            await axiosInstance.patch(`/products/${productId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    };





    const deleteProduct = async (productId) => {
        try {
            await axiosInstance.delete(`/products/${productId}`);
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    };






    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                fetchProfile,
                loginWithGoogle,
                register,
                logout,
                updateProfile,
                deleteAccount,
                changePassword,
                getSessions,
                logoutAllSessions,
                forgotPassword,
                resetPassword,
                askAI,
                sendVerificationEmail,
                products,
                productsLoading,
                fetchProducts,
                totalPages,
                fetchProductBySlug,
                addOrUpdateReview,
                deleteReview,
                getAllReviews,
                createProduct,
                updateProduct,
                deleteProduct
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthProvider, useAuth };