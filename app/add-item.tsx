import { ThemedText } from '@/components/themed-text';
import { scanItemWithAI } from '@/hooks/useAI';
import { scheduleExpiryNotification } from '@/hooks/useNotifications';
import { addItem } from '@/hooks/useStorage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { Bell, Calendar as CalendarIcon, ChevronLeft, Package, Sparkles, Tag } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['Food', 'Medicine', 'Document', 'Other'];

export default function AddItemScreen() {
    const [name, setName] = React.useState('');
    const [category, setCategory] = React.useState('Food');
    const [expiryDate, setExpiryDate] = React.useState('');
    const [reminderDays, setReminderDays] = React.useState('3');
    const [isScanning, setIsScanning] = React.useState(false);
    const router = useRouter();

    const handleAIScan = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            base64: true,
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].base64) {
            setIsScanning(true);
            const data = await scanItemWithAI(result.assets[0].base64);
            if (data) {
                setName(data.name);
                setCategory(data.category);
                setExpiryDate(data.expiryDate);
            }
            setIsScanning(false);
        }
    };

    const handleSave = async () => {
        if (!name || !expiryDate) return;

        try {
            const id = await addItem(name, category, expiryDate, parseInt(reminderDays));
            await scheduleExpiryNotification(id as number, name, expiryDate, parseInt(reminderDays));
            router.back();
        } catch (error) {
            console.error("Failed to add item:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: 'Add New Item',
                headerTransparent: true,
                headerTintColor: '#FFF',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                ),
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.aiSection}>
                    <TouchableOpacity
                        style={[styles.aiButton, isScanning && { opacity: 0.7 }]}
                        onPress={handleAIScan}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Sparkles size={20} color="#FFF" />
                        )}
                        <ThemedText style={styles.aiButtonText}>
                            {isScanning ? 'Scanning...' : 'AI Smart Scan'}
                        </ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.aiHint}>Take a photo and AI will fill the details</ThemedText>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Package size={16} color="#888" />
                            <ThemedText style={styles.label}>Item Name</ThemedText>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Milk, Ibuprofen..."
                            placeholderTextColor="#444"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Tag size={16} color="#888" />
                            <ThemedText style={styles.label}>Category</ThemedText>
                        </View>
                        <View style={styles.categoryRow}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        category === cat && styles.categoryChipActive
                                    ]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <ThemedText style={[
                                        styles.categoryChipText,
                                        category === cat && styles.categoryChipTextActive
                                    ]}>{cat}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <CalendarIcon size={16} color="#888" />
                            <ThemedText style={styles.label}>Expiry Date</ThemedText>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#444"
                            value={expiryDate}
                            onChangeText={setExpiryDate}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Bell size={16} color="#888" />
                            <ThemedText style={styles.label}>Remind me before (days)</ThemedText>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="3"
                            placeholderTextColor="#444"
                            keyboardType="number-pad"
                            value={reminderDays}
                            onChangeText={setReminderDays}
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <ThemedText style={styles.saveButtonText}>Add Item</ThemedText>
                    </TouchableOpacity>
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
        paddingTop: 100, // For transparent header
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    backButton: {
        marginLeft: 10,
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        padding: 6,
    },
    aiSection: {
        marginTop: 100,
        alignItems: 'center',
        marginBottom: 30,
        padding: 20,
        backgroundColor: '#151515',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed',
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3D5AFE',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
        marginBottom: 10,
    },
    aiButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    aiHint: {
        color: '#555',
        fontSize: 12,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 4,
    },
    label: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#151515',
        borderRadius: 12,
        padding: 15,
        color: '#FFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        backgroundColor: '#151515',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    categoryChipActive: {
        backgroundColor: '#3D5AFE20',
        borderColor: '#3D5AFE',
    },
    categoryChipText: {
        color: '#888',
        fontSize: 14,
    },
    categoryChipTextActive: {
        color: '#3D5AFE',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#3D5AFE',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#3D5AFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
