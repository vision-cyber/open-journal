
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

const JournalSpots: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [links, setLinks] = useState<{title: string, uri: string}[]>([]);

  const findSpots = async () => {
    if (!navigator.geolocation) {
      setResponse("Geolocation is not supported.");
      return;
    }

    setLoading(true);
    setResponse('');
    setLinks([]);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "List 3 quiet spots for journaling nearby. Be concise.",
        config: {
          tools: [{googleMaps: {}}],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            }
          }
        },
      });

      setResponse(res.text || '');
      const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setLinks(chunks.filter((c: any) => c.maps).map((c: any) => ({ title: c.maps.title, uri: c.maps.uri })));
    } catch (error: any) {
      setResponse("Could not find spots.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">explore_nearby</span>
          Nearby Spots
        </h3>
        <button 
          onClick={findSpots}
          disabled={loading}
          className="px-3 py-1.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-md border border-primary/20"
        >
          {loading ? 'Searching' : 'Find'}
        </button>
      </div>

      {response && (
        <div className="prose prose-sm prose-invert max-w-none text-slate-400 text-xs font-light leading-relaxed">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((link, i) => (
            <a key={i} href={link.uri} target="_blank" rel="noopener" className="text-[9px] font-black text-primary uppercase underline">
              {link.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalSpots;
