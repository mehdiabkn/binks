import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function NotificationSettings({ settings, onToggleSetting }) {
  const { t } = useTranslation();

  const notificationItems = [
    {
      key: 'notifications',
      label: t('settings.notifications.push.label'),
      description: t('settings.notifications.push.description'),
    },
    {
      key: 'dailyReminder',
      label: t('settings.notifications.dailyReminder.label'),
      description: t('settings.notifications.dailyReminder.description'),
    },
    {
      key: 'weeklyReport',
      label: t('settings.notifications.weeklyReport.label'),
      description: t('settings.notifications.weeklyReport.description'),
    },
  ];

  return (
    <View style={styles.settingsCard}>
      <Text style={styles.cardTitle}>{t('settings.notifications.title')}</Text>
      
      {notificationItems.map((item, index) => (
        <View 
          key={item.key} 
          style={[
            styles.settingItem,
            index === notificationItems.length - 1 && styles.lastSettingItem
          ]}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
          <Switch
            value={settings[item.key]}
            onValueChange={() => onToggleSetting(item.key)}
            trackColor={{ false: '#333', true: '#FFD700' }}
            thumbColor={settings[item.key] ? '#FFF' : '#999'}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 14,
  },
});