import CustomDrawerContent from '@/components/CustomDrawerContent';
import { Drawer } from 'expo-router/drawer';
import AuthGuard from '../../components/AuthGuard';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEADER_DARK = {
    backgroundColor: '#07090F',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
} as const;

const HEADER_TITLE = { color: '#f8fafc', fontWeight: '700' as const };

export default function DrawerLayout() {
    return (
        <SafeAreaView className="flex-1" edges={['left', 'right']}>
            <AuthGuard>
                <Drawer
                    drawerContent={(props) => <CustomDrawerContent {...props} />}
                    screenOptions={{
                        headerShown: true,
                        headerStyle: HEADER_DARK,
                        headerTintColor: '#a5b4fc',
                        headerTitleStyle: HEADER_TITLE,
                        drawerType: 'front',
                        drawerStyle: {
                            width: 300,
                            backgroundColor: '#07090F',
                        },
                        overlayColor: 'rgba(0,0,0,0.65)',
                        swipeEnabled: true,
                        drawerActiveTintColor: '#a5b4fc',
                        drawerInactiveTintColor: '#64748b',
                    }}
                >
                    <Drawer.Screen
                        name="(tab)"
                        options={{
                            title: 'Convoo',
                            drawerItemStyle: { display: 'none' },
                            drawerLabel: () => null,
                        }}
                    />
                    <Drawer.Screen
                        name="profile"
                        options={{
                            title: 'Profile',
                            drawerItemStyle: { display: 'none' },
                            drawerLabel: () => null,
                        }}
                    />
                    <Drawer.Screen
                        name="setting"
                        options={{
                            title: 'Settings',
                            drawerItemStyle: { display: 'none' },
                            drawerLabel: () => null,
                        }}
                    />
                </Drawer>
            </AuthGuard>
        </SafeAreaView>
    );
}
