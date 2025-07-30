// pages/api/risk.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng parameters' });
  }

  try {
    // FEMA NFHL Query Endpoint
    const femaUrl = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,STATIC_BFE&returnGeometry=false&f=json`;

    const femaResponse = await fetch(femaUrl);
    const femaData = await femaResponse.json();

    let inFloodZone = false;
    let floodZoneCode = null;

    if (femaData.features && femaData.features.length > 0) {
      inFloodZone = true;
      floodZoneCode = femaData.features[0].attributes.FLD_ZONE;
    }

    // Temporary risk calculation: higher if in flood zone
    const riskScore = inFloodZone
      ? Math.floor(70 + Math.random() * 30)
      : Math.floor(Math.random() * 50);

    res.status(200).json({
      risk_score: riskScore,
      risk_level:
        riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high',
      in_flood_zone: inFloodZone,
      flood_zone_code: floodZoneCode || 'N/A',
      active_alerts: [], // NOAA will be added next
      data_sources: {
        fema: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching FEMA data:', error);
    res.status(500).json({ error: 'Failed to fetch flood risk data' });
  }
}
