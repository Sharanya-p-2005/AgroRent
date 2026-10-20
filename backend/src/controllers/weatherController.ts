import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Builds the canonical OpenWeatherMap 2.5 API endpoint URL.
 * Gracefully handles base URLs with or without trailing slashes,
 * or where WEATHER_API_URL was set to the API root (e.g. https://api.openweathermap.org/data/2.5).
 */
function resolveOpenWeatherEndpoint(
  endpointType: 'weather' | 'forecast',
  locationOrQuery: string,
  apiKey: string,
  lat?: string,
  lon?: string,
  customApiUrl?: string
): string {
  let baseUrl = 'https://api.openweathermap.org/data/2.5';
  if (customApiUrl && customApiUrl.trim() !== '') {
    let trimmed = customApiUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/weather') || trimmed.endsWith('/forecast')) {
      trimmed = trimmed.replace(/\/(weather|forecast)$/, '');
    }
    baseUrl = trimmed;
  }

  let queryPart = '';
  if (lat && lon) {
    queryPart = `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  } else {
    queryPart = `q=${encodeURIComponent(locationOrQuery.trim())}`;
  }

  return `${baseUrl}/${endpointType}?${queryPart}&appid=${encodeURIComponent(apiKey.trim())}&units=metric`;
}

/**
 * Builds location search candidates for geocoding resilience.
 * E.g., for "Channapatna Rural, Ramanagara, Karnataka", generates:
 * ["Channapatna Rural, Ramanagara, Karnataka", "Ramanagara, Karnataka", "Ramanagara", "Channapatna"]
 */
function buildLocationCandidates(location: string): string[] {
  const trimmed = location.trim();
  const list: string[] = [trimmed];
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length > 1) {
    if (parts.length >= 2) {
      list.push(parts.slice(-2).join(', '));
      list.push(parts[parts.length - 2]);
    }
    const cleanFirst = parts[0].replace(/\b(rural|urban|village|taluk|hobli)\b/gi, '').trim();
    if (cleanFirst && cleanFirst !== parts[0]) {
      list.push(cleanFirst);
    }
    list.push(parts[0]);
  }

  return Array.from(new Set(list));
}

function formatErrorMessage(error: any, location: string): string {
  const statusCode = error?.response?.status;
  const apiMessage = error?.response?.data?.message;

  if (statusCode === 401) {
    return 'OpenWeatherMap API key is unauthorized or still activating (new keys can take up to 1-2 hours).';
  }
  if (statusCode === 404) {
    return `Weather location '${location}' was not found. Please try entering a district or town name.`;
  }
  if (statusCode === 429) {
    return 'Weather provider rate limit reached. Please try again shortly.';
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Weather request timed out. Please check your network connection and retry.';
  }
  if (apiMessage) {
    return `Weather provider: ${apiMessage}`;
  }
  if (error?.message) {
    return `Network error: ${error.message}`;
  }
  return 'Unable to retrieve live meteorological data at this time.';
}

export class WeatherController {
  /**
   * GET /api/weather/current
   * Query params: location (e.g. 'Mandya, Karnataka', 'Bangalore', 'Ramanagara'), lat, lon
   */
  static async getCurrent(req: Request, res: Response): Promise<any> {
    const apiKey = process.env.WEATHER_API_KEY;
    const apiUrl = process.env.WEATHER_API_URL;
    const location = (req.query.location as string) || 'Mandya, Karnataka';
    const lat = req.query.lat as string;
    const lon = req.query.lon as string;

    if (!apiKey || apiKey.trim() === '') {
      return res.status(200).json({
        success: true,
        configured: false,
        message: 'Weather service is unconfigured. Set WEATHER_API_KEY in server environment to enable live meteorological data.',
        location,
        data: null,
      });
    }

    try {
      const candidates = lat && lon ? [''] : buildLocationCandidates(location);
      let data: any = null;
      let lastError: any = null;

      for (const cand of candidates) {
        try {
          const endpoint = resolveOpenWeatherEndpoint(
            'weather',
            cand || location,
            apiKey,
            lat,
            lon,
            apiUrl
          );
          const response = await axios.get(endpoint, { timeout: 6000 });
          if (response.data) {
            data = response.data;
            break;
          }
        } catch (err: any) {
          lastError = err;
          // If error is not 404 (e.g. 401 Unauthorized or network timeout), do not cycle candidates
          if (err.response?.status !== 404) {
            break;
          }
        }
      }

      if (!data) {
        throw lastError || new Error(`Weather data not found for ${location}`);
      }

      const formatted = {
        location: data.name || location,
        country: data.sys?.country || 'IN',
        temperature: Math.round(data.main?.temp ?? 0),
        feels_like: Math.round(data.main?.feels_like ?? 0),
        temp_min: Math.round(data.main?.temp_min ?? 0),
        temp_max: Math.round(data.main?.temp_max ?? 0),
        humidity: data.main?.humidity ?? 0,
        pressure: data.main?.pressure ?? 0,
        wind_speed: data.wind?.speed ?? 0,
        condition: data.weather?.[0]?.main || 'Clear',
        description: data.weather?.[0]?.description || 'clear sky',
        icon: data.weather?.[0]?.icon || '01d',
        timestamp: new Date().toISOString(),
        advisory: generateAdvisory(data.main?.temp, data.weather?.[0]?.main, data.wind?.speed),
      };

      return res.status(200).json({
        success: true,
        configured: true,
        data: formatted,
      });
    } catch (error: any) {
      console.warn('[WeatherController.getCurrent error]:', error.message);
      return res.status(200).json({
        success: false,
        configured: true,
        message: formatErrorMessage(error, location),
        location,
        data: null,
      });
    }
  }

  /**
   * GET /api/weather/forecast
   */
  static async getForecast(req: Request, res: Response): Promise<any> {
    const apiKey = process.env.WEATHER_API_KEY;
    const apiUrl = process.env.WEATHER_API_URL;
    const location = (req.query.location as string) || 'Mandya, Karnataka';

    if (!apiKey || apiKey.trim() === '') {
      return res.status(200).json({
        success: true,
        configured: false,
        message: 'Weather forecast is unconfigured. Set WEATHER_API_KEY in server environment to enable live 5-day forecasts.',
        location,
        data: null,
      });
    }

    try {
      const candidates = buildLocationCandidates(location);
      let data: any = null;
      let lastError: any = null;

      for (const cand of candidates) {
        try {
          const endpoint = resolveOpenWeatherEndpoint(
            'forecast',
            cand || location,
            apiKey,
            undefined,
            undefined,
            apiUrl
          );
          const response = await axios.get(endpoint, { timeout: 6000 });
          if (response.data) {
            data = response.data;
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (err.response?.status !== 404) {
            break;
          }
        }
      }

      if (!data) {
        throw lastError || new Error(`Forecast data not found for ${location}`);
      }

      const list = data.list || [];

      const forecast = list.slice(0, 5).map((item: any) => ({
        dt_txt: item.dt_txt,
        temperature: Math.round(item.main?.temp ?? 0),
        condition: item.weather?.[0]?.main || 'Clear',
        description: item.weather?.[0]?.description || '',
        icon: item.weather?.[0]?.icon || '01d',
        humidity: item.main?.humidity ?? 0,
        rain_prob: Math.round((item.pop || 0) * 100),
      }));

      return res.status(200).json({
        success: true,
        configured: true,
        location: data.city?.name || location,
        data: forecast,
      });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        configured: true,
        message: formatErrorMessage(error, location),
        location,
        data: null,
      });
    }
  }
}

function generateAdvisory(temp?: number, condition?: string, wind?: number): string {
  if (condition?.toLowerCase().includes('rain')) {
    return 'Rain expected or active. Defer pesticide spraying and harvest operations. Ensure drainage in low-lying crop beds.';
  }
  if (temp && temp > 35) {
    return 'High temperature warning. Schedule irrigation during early morning or dusk to minimize evaporative loss.';
  }
  if (wind && wind > 8) {
    return 'Strong gusts detected. Secure greenhouse tarpaulins and postpone high-pressure crop spraying.';
  }
  return 'Favorable conditions for field preparation, tractor operations, and fertilizer application.';
}
