import { ThemedText } from '@/components/themed-text';
import { getDeviceId, syncData } from '@/hooks/useStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { Bell, ChevronRight, Shield, Users } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const HOUSEHOLD_KEY = 'expiry_guard_household_id';

export default function SettingsScreen() {
    const [householdId, setHouseholdId] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [currentHousehold, setCurrentHousehold] = React.useState<string | null>(null);

    React.useEffect(() => {
        loadHousehold();
    }, []);

    const loadHousehold = async () => {
        const saved = await AsyncStorage.getItem(HOUSEHOLD_KEY);
        setCurrentHousehold(saved);
        if (saved) setHouseholdId(saved);
    };

    const handleJoinHousehold = async () => {
        if (!householdId.trim()) return;

        setIsSaving(true);
        try {
            await AsyncStorage.setItem(HOUSEHOLD_KEY, householdId.trim().toUpperCase());
            setCurrentHousehold(householdId.trim().toUpperCase());
            // Trigger a sync immediately
            await syncData();
            Alert.alert('Success', 'You have joined the household!');
        } catch (e) {
            Alert.alert('Error', 'Failed to join household.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLeaveHousehold = async () => {
        Alert.alert(
            'Leave Household',
            'Are you sure? Your data will remain on this device but will no longer sync with the household.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem(HOUSEHOLD_KEY);
                        setCurrentHousehold(null);
                        setHouseholdId('');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerTitle: 'Settings',
                headerStyle: { backgroundColor: '#0A0A0A' },
                headerTintColor: '#FFF',
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Account & Sync</ThemedText>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Users size={20} color="#3D5AFE" />
                            </View>
                            <View>
                                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Household Sync</ThemedText>
                                <ThemedText style={styles.cardSubtitle}>Share your list with family or roommates</ThemedText>
                            </View>
                        </View>

                        <View style={styles.syncContent}>
                            {currentHousehold ? (
                                <View style={styles.activeHousehold}>
                                    <View style={styles.householdInfo}>
                                        <ThemedText style={styles.householdLabel}>Active Household ID:</ThemedText>
                                        <ThemedText style={styles.householdValue}>{currentHousehold}</ThemedText>
                                    </View>
                                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveHousehold}>
                                        <ThemedText style={styles.leaveButtonText}>Leave</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.joinForm}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Household ID (e.g. SMITHS-2024)"
                                        placeholderTextColor="#444"
                                        value={householdId}
                                        onChangeText={setHouseholdId}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity
                                        style={styles.joinButton}
                                        onPress={handleJoinHousehold}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <ThemedText style={styles.joinButtonText}>Join Household</ThemedText>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>App Preferences</ThemedText>

                    <TouchableOpacity style={styles.listItem}>
                        <View style={styles.listIconBox}>
                            <Bell size={18} color="#888" />
                        </View>
                        <ThemedText style={styles.listText}>Notification Settings</ThemedText>
                        <ChevronRight size={18} color="#444" style={styles.listArrow} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.listItem}>
                        <View style={styles.listIconBox}>
                            <Shield size={18} color="#888" />
                        </View>
                        <ThemedText style={styles.listText}>Privacy & Security</ThemedText>
                        <ChevronRight size={18} color="#444" style={styles.listArrow} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Experimental</ThemedText>
                    <ThemedText style={styles.infoText}>Device ID: {getDeviceId()}</ThemedText>
                </View>

                <View style={styles.footer}>
                    <ThemedText style={styles.versionText}>Expiry Guard v1.2.0</ThemedText>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 35,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#151515',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    iconBox: {
        backgroundColor: '#3D5AFE15',
        padding: 12,
        borderRadius: 15,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 16,
    },
    cardSubtitle: {
        color: '#666',
        fontSize: 12,
    },
    syncContent: {
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 20,
    },
    joinForm: {
        gap: 12,
    },
    input: {
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 15,
        color: '#FFF',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    joinButton: {
        backgroundColor: '#3D5AFE',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    joinButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    activeHousehold: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#3D5AFE40',
    },
    householdInfo: {
        gap: 4,
    },
    householdLabel: {
        color: '#666',
        fontSize: 11,
    },
    householdValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    leaveButton: {
        backgroundColor: '#FF525220',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
    },
    leaveButtonText: {
        color: '#FF5252',
        fontWeight: 'bold',
        fontSize: 13,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#151515',
        padding: 16,
        borderRadius: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    listIconBox: {
        marginRight: 15,
    },
    listText: {
        color: '#FFF',
        fontSize: 15,
        flex: 1,
    },
    listArrow: {
        marginLeft: 10,
    },
    infoText: {
        color: '#444',
        fontSize: 11,
        textAlign: 'center',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    versionText: {
        color: '#333',
        fontSize: 12,
    },
});
