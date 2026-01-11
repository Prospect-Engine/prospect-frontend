const config = {
  // ------ Invitations ------ //
  getInvitationList: "/api/outreach/invitations/getInvitationList",
  withdrawInvitation: "/api/outreach/invitations/withdrawInvitation",
  acceptInvitation: "/api/outreach/invitations/acceptInvitation",
  rejectInvitation: "/api/outreach/invitations/rejectInvitation",
  // ------ Connections ------ //
  getConnectionList: "/api/outreach/connections/getConnectionList",
  getConnectionCSV: "/api/outreach/connections/getCSV",
  updateConnection: "/api/outreach/connections/updateConnection",

  // ------ Excluded ------ //
  getExcludedList: "/api/outreach/excluded/getExcludedList",
};

export default config;
