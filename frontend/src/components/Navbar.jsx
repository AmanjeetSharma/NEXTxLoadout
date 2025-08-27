import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx"; // Import useCart
import defaultAvatar from "../assets/default-avatar.png";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUser,
    FaChartLine,
    FaInfoCircle,
    FaEnvelope,
    FaSignOutAlt,
    FaLock,
    FaBars,
    FaFacebook,
    FaTwitter,
    FaInstagram,
    FaShoppingCart, // Add cart icon
} from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { PiDotsThreeBold } from "react-icons/pi";
import GradientText from "./Animations/GradientText.jsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cart, cartCount, cartLoading } = useCart(); // Get cart data
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const guestDropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        setOpen(false);
        navigate("/");
    };

    const handleNavigation = (to) => {
        setOpen(false);
        setMobileMenuOpen(false);
        navigate(to);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMobileMenuOpen(false);
            }
            if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 py-3 z-40 bg-gray-900/80 backdrop-blur-md border-b border-cyan-400/50 shadow-lg">
                {/* Logo */}
                <div className="flex items-center h-12">
                    <Link to="/" className="flex items-center space-x-2 cursor-pointer">
                        <GradientText>NEXTxLoadout</GradientText>
                    </Link>
                </div>

                {/* Desktop Navigation - Guest dropdown menu */}
                <div className="hidden md:flex items-center h-12 space-x-4">
                    {/* Cart Icon - Only for logged in users */}
                    {user && (
                        <motion.div
                            className="relative"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <button
                                onClick={() => navigate("/cart")}
                                className="p-2 rounded-full hover:bg-gray-700/50 text-white focus:outline-none transition-all duration-300 h-10 w-10 flex items-center justify-center cursor-pointer relative"
                            >
                                <FaShoppingCart className="w-5 h-5" />
                                {!cartLoading && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {!user ? (
                        <div className="relative" ref={guestDropdownRef}>
                            <button
                                onClick={() => setOpen(!open)}
                                className="p-2 rounded-full hover:bg-gray-700/50 text-white focus:outline-none transition-all duration-300 h-10 flex items-center justify-center cursor-pointer"
                            >
                                <motion.div
                                    animate={open ? { rotate: 180, scale: 1.2 } : { rotate: 0, scale: 1 }}
                                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                                    className="flex items-center justify-center"
                                >
                                    {open ? (
                                        <IoIosClose className="w-6 h-6" />
                                    ) : (
                                        <PiDotsThreeBold className="w-6 h-6" />
                                    )}
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-xl z-20 overflow-hidden border border-cyan-400/20"
                                    >
                                        <div className="py-2">
                                            <button
                                                onClick={() => handleNavigation("/accessories")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                🛍️ Accessories
                                            </button>
                                            <button
                                                onClick={() => handleNavigation("/about")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                <FaInfoCircle className="text-lg text-cyan-300" />
                                                About Us
                                            </button>
                                            <button
                                                onClick={() => handleNavigation("/contact")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                <FaEnvelope className="text-lg text-blue-300" />
                                                Contact
                                            </button>
                                            <button
                                                onClick={() => handleNavigation("/login")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-600 hover:to-blue-700 cursor-pointer transition-colors mt-2 mx-2 rounded-md"
                                            >
                                                <FaLock className="text-lg text-yellow-200" />
                                                Sign In
                                            </button>
                                        </div>
                                        <div className="border-t border-gray-700/50 px-4 py-3 flex justify-center space-x-4">
                                            <a href="https://facebook.com" className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">
                                                <FaFacebook />
                                            </a>
                                            <a href="https://twitter.com" className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">
                                                <FaTwitter />
                                            </a>
                                            <a href="https://instagram.com" className="text-gray-400 hover:text-pink-400 cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">
                                                <FaInstagram />
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        /* Userdropdown menu */
                        <div className="relative" ref={dropdownRef}>
                            <motion.div
                                className="flex items-center space-x-2 cursor-pointer group h-10"
                                onClick={() => setOpen((prev) => !prev)}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="relative">
                                    <img
                                        src={user.avatar || defaultAvatar}
                                        alt="Avatar"
                                        className="w-9 h-9 rounded-full object-cover border-2 border-gray-300 group-hover:border-cyan-300 transition-all duration-300"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" />
                                </div>
                                <span className="font-medium text-white">
                                    Hi, {user.name}
                                </span>
                            </motion.div>

                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-56 bg-gray-800 text-white rounded-lg shadow-xl z-20 overflow-hidden border border-cyan-400/20"
                                    >
                                        <div className="border-b border-gray-700/50 py-1">
                                            <div className="px-4 py-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                                                User
                                            </div>
                                            <button
                                                onClick={() => handleNavigation("/profile")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                <FaUser className="text-lg text-green-300" />
                                                Profile
                                            </button>
                                            <button
                                                onClick={() => handleNavigation("/dashboard")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                <FaChartLine className="text-lg text-blue-300" />
                                                Dashboard
                                            </button>
                                        </div>

                                        <div className="border-b border-gray-700/50 py-1">
                                            <div className="px-4 py-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                                                Company
                                            </div>
                                            {user?.role === "ADMIN" && (
                                                <button
                                                    onClick={() => handleNavigation("/admin-panel")}
                                                    className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-purple-700 hover:text-white cursor-pointer transition-colors text-purple-300 hover:border-l-1 hover:border-r-1 border-white"
                                                >
                                                    🛠️ Admin Panel
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleNavigation("/accessories")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                🛍️ Accessories
                                            </button>
                                            <button
                                                onClick={() => handleNavigation("/about")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                <FaInfoCircle className="text-lg text-cyan-300" />
                                                About Us
                                            </button>
                                            <button
                                                onClick={() => handleNavigation("/contact")}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700/60 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 border-cyan-400/80"
                                            >
                                                <FaEnvelope className="text-lg text-blue-300" />
                                                Contact
                                            </button>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors hover:border-l-1 hover:border-r-1 borde-red-500"
                                            >
                                                <FaSignOutAlt className="text-lg" />
                                                Logout
                                            </button>
                                        </div>
                                        <div className="border-t border-gray-700/50 px-4 py-3 flex justify-center space-x-4">
                                            <a href="https://facebook.com" className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">
                                                <FaFacebook />
                                            </a>
                                            <a href="https://twitter.com" className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">
                                                <FaTwitter />
                                            </a>
                                            <a href="https://instagram.com" className="text-gray-400 hover:text-pink-400 cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">
                                                <FaInstagram />
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white p-2 focus:outline-none h-10 flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <IoIosClose className="w-6 h-6" />
                    ) : (
                        <FaBars className="w-6 h-6" />
                    )}
                </button>

                {/* Mobile Menu */}
            </nav>
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        ref={mobileMenuRef}
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="md:hidden fixed top-0 right-0 h-full w-3/4 max-w-sm bg-gray-900/95 backdrop-blur-lg z-50 pt-20 px-6 shadow-2xl overflow-y-auto border-l border-cyan-400/30"
                    >
                        {/* Close button for mobile menu */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-4 right-4 text-white p-2 focus:outline-none"
                            aria-label="Close menu"
                        >
                            <IoIosClose className="w-6 h-6" />
                        </button>

                        {/* Add Cart to Mobile Menu for logged in users */}
                        {user && (
                            <button
                                onClick={() => {
                                    handleNavigation("/cart");
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors mb-4 w-full border border-cyan-400/30"
                            >
                                <div className="relative">
                                    <FaShoppingCart className="text-lg text-cyan-300" />
                                    {!cartLoading && cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                                <span>My Cart ({cartCount})</span>
                            </button>
                        )}

                        <div className="flex flex-col space-y-2">
                            {!user ? (
                                <>
                                    <button
                                        onClick={() => handleNavigation("/accessories")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        🛍️ Accessories
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/about")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        <FaInfoCircle className="text-lg text-cyan-300" />
                                        About Us
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/contact")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        <FaEnvelope className="text-lg text-blue-300" />
                                        Contact
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/login")}
                                        className="flex items-center gap-3 text-left py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-colors mt-4"
                                    >
                                        <FaLock className="text-lg text-yellow-200" />
                                        Sign In
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
                                        <img
                                            src={user.avatar || defaultAvatar}
                                            alt="Avatar"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-cyan-300/50"
                                        />
                                        <div>
                                            <p className="font-semibold text-white">{user.name}</p>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="px-4 py-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                                        Account
                                    </div>
                                    <button
                                        onClick={() => handleNavigation("/profile")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        <FaUser className="text-lg text-green-300" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/dashboard")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        <FaChartLine className="text-lg text-blue-300" />
                                        Dashboard
                                    </button>

                                    <div className="px-4 py-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                                        Company
                                    </div>
                                    {user?.role === "ADMIN" && (
                                        <button
                                            onClick={() => handleNavigation("/admin-panel")}
                                            className="flex items-center gap-3 text-left py-3 px-4 text-purple-300 hover:bg-gray-800/50 rounded-lg transition-colors"
                                        >
                                            🛠️ Admin Panel
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleNavigation("/accessories")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        🛍️ Accessories
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/about")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        <FaInfoCircle className="text-lg text-cyan-300" />
                                        About Us
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/contact")}
                                        className="flex items-center gap-3 text-left py-3 px-4 text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                                    >
                                        <FaEnvelope className="text-lg text-blue-300" />
                                        Contact
                                    </button>

                                    <div className="border-t border-gray-800 pt-2 mt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 text-left py-3 px-4 text-red-300 hover:bg-gray-800/50 rounded-lg transition-colors"
                                        >
                                            <FaSignOutAlt className="text-lg" />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800">
                            <div className="flex justify-center space-x-6 py-4">
                                <a href="https://facebook.com" className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" rel="noopener noreferrer" target="_blank">
                                    <FaFacebook className="w-5 h-5" />
                                </a>
                                <a href="https://twitter.com" className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" rel="noopener noreferrer" target="_blank">
                                    <FaTwitter className="w-5 h-5" />
                                </a>
                                <a href="https://instagram.com" className="text-gray-400 hover:text-pink-400 cursor-pointer transition-colors" rel="noopener noreferrer" target="_blank">
                                    <FaInstagram className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}