import { Fragment } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Layout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' },
    { name: 'Passport', href: '/passport', current: location.pathname === '/passport' },
    { name: 'Sessions', href: '/sessions', current: location.pathname === '/sessions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Disclosure as="nav" className="bg-white shadow-sm dark:bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <div className="flex flex-shrink-0 items-center">
                    <Link to="/" className="text-xl font-bold text-primary-600">
                      IntiMate
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {user && navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'border-primary-500 text-gray-900 dark:text-white'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-800">
                          <span className="sr-only">Open user menu</span>
                          <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/profile"
                                className={classNames(
                                  active ? 'bg-gray-100 dark:bg-gray-600' : '',
                                  'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                                )}
                              >
                                Your Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => signOut()}
                                className={classNames(
                                  active ? 'bg-gray-100 dark:bg-gray-600' : '',
                                  'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <div className="flex space-x-4">
                      <Link
                        to="/login"
                        className="rounded-md bg-white px-3 py-2 text-sm font-medium text-primary-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-primary-400 dark:hover:bg-gray-600"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:hover:bg-gray-700">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              {user && (
                <div className="space-y-1 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-gray-700 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                      )}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-200 pb-3 pt-4 dark:border-gray-700">
                {user ? (
                  <>
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800 dark:text-white">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Disclosure.Button
                        as={Link}
                        to="/profile"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        Your Profile
                      </Disclosure.Button>
                      <Disclosure.Button
                        as="button"
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        Sign out
                      </Disclosure.Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as={Link}
                      to="/login"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      Log in
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/register"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      Sign up
                    </Disclosure.Button>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
