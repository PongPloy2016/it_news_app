import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: { gap: 14, padding: 16 },

  /* Category Group Headers */
  groupHeaderWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: -2,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  groupHeaderDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  groupHeaderText: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  groupHeaderLine: {
    flex: 1,
    height: 1,
    marginLeft: 6,
    opacity: 0.5,
  },

  /* 1. App Brand Banner */
  brandBanner: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  brandLogoWrap: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    height: 56,
    overflow: 'hidden',
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: 56,
  },
  brandLogoImage: {
    borderRadius: 15,
    height: '100%',
    width: '100%',
  },
  brandTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  brandTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandVersionPill: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  brandLiveDot: {
    backgroundColor: '#10B981',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  brandVersionText: {
    fontWeight: '700',
  },
  brandTagline: {
    lineHeight: 16,
    marginTop: 3,
  },

  /* Announcement */
  announcementCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  announcementIconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  announcementTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  announcementDesc: {
    lineHeight: 18,
  },

  /* Grouped Section Styles */
  sectionContainer: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  sectionIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sectionTitleText: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitleText: {
    marginTop: 2,
  },
  sectionBody: {
    gap: 10,
  },

  /* 3. Layout Cards Row */
  layoutCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  layoutCardItem: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    padding: 10,
    position: 'relative',
  },
  schematicBox: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    padding: 6,
    width: '100%',
  },
  schematicCompactWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  schematicCompactThumb: {
    borderRadius: 4,
    height: 24,
    width: 22,
  },
  schematicMagWrap: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  schematicMagHero: {
    borderRadius: 3,
    height: 18,
    width: '90%',
  },
  schematicGridWrap: {
    flexDirection: 'row',
    gap: 4,
    height: '100%',
    justifyContent: 'center',
  },
  schematicGridCol: {
    alignItems: 'center',
    flex: 1,
  },
  schematicGridThumb: {
    borderRadius: 3,
    height: 18,
    width: '100%',
  },
  schematicLine: {
    borderRadius: 2,
    height: 4,
  },
  layoutCardLabelWrap: {
    alignItems: 'center',
  },
  layoutCardTitle: {
    textAlign: 'center',
  },
  layoutCardDesc: {
    marginTop: 2,
    textAlign: 'center',
  },
  layoutCheckBadge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 18,
  },

  /* Clean Human-Designed Theme Dropdown */
  themeDropdownContainer: {
    width: '100%',
  },
  themeDropdownTrigger: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  themeDropdownLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  themeColorDot: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  themeDropdownTitle: {
    fontWeight: '600',
  },
  themeDropdownMenu: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  themeDropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  themeDropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionTitle: {},

  /* Segmented Pill Track */
  segmentedTrack: {
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segmentedTab: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  segmentedTabActive: {
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  segmentedText: {
    textAlign: 'center',
  },
  languageIndicatorRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  languageIndicatorText: {
    fontWeight: '600',
  },

  /* Live Preview Card */
  livePreviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    padding: 14,
  },
  livePreviewTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  livePreviewTag: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  livePreviewTagText: {
    fontWeight: '700',
  },
  liveScaleBadge: {
    fontWeight: '500',
  },
  liveHeadline: {
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  liveDesc: {
    lineHeight: 19,
    marginBottom: 8,
  },
  liveMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  liveDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  liveMetaText: {
    fontWeight: '500',
  },

  /* Reading settings row */
  fieldSubLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  settingRowItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowItemTitle: {
    fontWeight: '700',
  },
  rowItemDesc: {
    lineHeight: 17,
    marginTop: 2,
  },
  rowItemIconBadge: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },

  /* Cloud Card Box */
  cloudCardBox: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cloudStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  cloudPulseWrap: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  cloudDot: {
    backgroundColor: '#10B981',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  cloudStatusTitle: {
    fontWeight: '700',
  },
  cloudStatusSub: {
    marginTop: 1,
  },
  deviceIdBar: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deviceIdLabel: {
    fontWeight: '600',
  },
  deviceIdValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    marginTop: 1,
  },
  sharePillBtn: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sharePillText: {
    fontWeight: '700',
  },
  cloudSyncActionBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  cloudSyncActionBtnText: {
    fontWeight: '700',
  },

  /* Storage & Data Metrics */
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    gap: 2,
    paddingVertical: 8,
  },
  metricIconCircle: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginBottom: 4,
    width: 28,
  },
  metricChipLabel: {
    fontWeight: '600',
  },
  metricChipValue: {
    fontWeight: '800',
  },
  storageActionsList: {
    marginTop: 4,
  },
  storageRowItem: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  storageItemTitle: {
    fontWeight: '700',
  },
  storageItemSub: {
    marginTop: 2,
  },
  tablePillBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tablePillBtnText: {
    fontWeight: '700',
  },
  tablePillBtnDestructive: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tablePillBtnDestructiveText: {
    fontWeight: '700',
  },

  /* Links List */
  linkListWrap: {
    borderRadius: 14,
  },
  linkRowItem: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 11,
  },
  linkItemIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  linkItemLabel: {
    flex: 1,
    fontWeight: '600',
  },
  linkItemSub: {
    marginTop: 2,
  },

  footerWrap: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 20,
  },
  footerText: {
    fontWeight: '500',
  },

  /* Modal */
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalDragHandle: {
    alignSelf: 'center',
    backgroundColor: '#94A3B8',
    borderRadius: 3,
    height: 4,
    marginBottom: 14,
    opacity: 0.5,
    width: 40,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 88,
    padding: 12,
    textAlignVertical: 'top',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    padding: 12,
  },
  submitModalBtn: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 18,
    padding: 13,
  },
  submitModalBtnText: {
    fontWeight: '800',
  },
});
