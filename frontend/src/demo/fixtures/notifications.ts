import type { NotificationPreferencesData } from '@/lib/data/notifications'

export const notificationPreferencesFixture: NotificationPreferencesData = {
  notifications: {
    email_new_message: true,
    push_new_message: true,
    email_search_alert: true,
    push_search_alert: true,
    email_boost_activated: true,
    email_offer_received: true,
    email_listing_expiring: true,
    email_listing_expired: true,
    email_performance_report: true,
    push_performance_report: false,
    performance_report_frequency: 'weekly',
  },
  bonPlans: {
    notify_all: false,
    notify_categories: ['alimentation', 'maison'],
    notify_businesses: ['Maison du Caillou'],
    via_push: true,
    via_email: false,
  },
  businesses: [
    { name: 'Maison du Caillou' },
    { name: 'Marché du Centre' },
    { name: 'Lagon Sport' },
  ],
}
