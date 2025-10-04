import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    HomeIcon,
    PlusCircleIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Generate Agents', href: '/generate', icon: PlusCircleIcon },
        { name: 'Agent Library', href: '/agents', icon: UserGroupIcon },
        { name: 'Chat Interface', href: '/chat', icon: ChatBubbleLeftRightIcon },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                    <nav className="fixed top-0 left-0 bottom-0 flex flex-col w-5/6 max-w-sm bg-white shadow-xl">
                        <div className="px-6 py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">AI</span>
                                    </div>
                                    <span className="ml-3 text-xl font-bold text-gray-900">Agent Portal</span>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 px-6 pb-6">
                            <SidebarContent navigation={navigation} currentPath={location.pathname} />
                        </div>
                    </nav>
                </div>
            )}

            {/* Desktop sidebar */}
            <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-center h-16 flex-shrink-0 px-6 bg-white border-b border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">AI</span>
                        </div>
                        <span className="ml-3 text-xl font-bold text-gray-900">Agent Portal</span>
                    </div>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <div className="px-6 py-6">
                            <SidebarContent navigation={navigation} currentPath={location.pathname} />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Top header */}
                <header className="bg-white shadow-sm border-b border-gray-200 lg:border-b-0">
                    <div className="flex items-center justify-between h-16 px-6">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        {/* Page title - you can make this dynamic */}
                        <div className="hidden lg:block">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                            </h1>
                        </div>

                        {/* User menu */}
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                Welcome, <span className="font-medium text-gray-900">{user?.name}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out"
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

const SidebarContent = ({ navigation, currentPath }) => {
    return (
        <nav className="space-y-2">
            {navigation.map((item) => {
                const isActive = currentPath === item.href;
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            isActive
                                ? 'bg-rose-50 text-rose-700 border-r-2 border-rose-500'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <item.icon
                            className={`mr-3 h-5 w-5 ${
                                isActive ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                        />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
};

export default Layout;
