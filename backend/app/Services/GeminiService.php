<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;

    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY', ''));
        $this->model = config('services.gemini.model', 'gemini-1.5-pro');
    }

    public function auditBudget(array $budgetData): string
    {
        if (empty($this->apiKey)) {
            return $this->fallbackAudit($budgetData);
        }

        $prompt = $this->buildPrompt($budgetData);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();

                return $data['candidates'][0]['content']['parts'][0]['text'] ?? $this->fallbackAudit($budgetData);
            }

            Log::error('Gemini API Error: '.$response->body());

            return $this->fallbackAudit($budgetData);
        } catch (\Exception $e) {
            Log::error('Gemini API Exception: '.$e->getMessage());

            return $this->fallbackAudit($budgetData);
        }
    }

    protected function buildPrompt(array $data): string
    {
        $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return "Sebagai auditor keuangan profesional untuk event {$data['event']['name']}, analisis data RAB berikut:\n\n{$jsonData}\n\nBerikan analisis dalam format JSON murni tanpa markdown (tanpa ```json ... ```) mencakup:
1. 'warnings': array string peringatan (misal: markup harga, proporsi divisi > 30%, overbudget)
2. 'recommendations': array string rekomendasi efisiensi
3. 'reallocation_suggestions': array string saran realokasi dana
4. 'summary': ringkasan status keuangan secara keseluruhan\n\nFormat output HARUS berupa JSON valid dengan keys: warnings, recommendations, reallocation_suggestions, summary.";
    }

    protected function fallbackAudit(array $data): string
    {
        $warnings = [];
        $recommendations = [];
        $reallocationSuggestions = [];

        foreach ($data['divisions'] as $division) {
            if ($division['budget_usage_percent'] > 100) {
                $warnings[] = "Divisi {$division['name']} overbudget ({$division['budget_usage_percent']}%)";
            } elseif ($division['budget_usage_percent'] > 80) {
                $warnings[] = "Divisi {$division['name']} mendekati batas anggaran ({$division['budget_usage_percent']}%)";
            }

            $totalBudget = $data['event']['total_budget'];
            $divisionProportion = $totalBudget > 0 ? ($division['total_spent'] / $totalBudget) * 100 : 0;
            if ($divisionProportion > 30) {
                $warnings[] = "Divisi {$division['name']} mengonsumsi ".round($divisionProportion, 2).'% dari total budget (di atas 30%)';
            }
        }

        if (count($warnings) > 0) {
            $recommendations[] = 'Tinjau kembali item berbiaya tinggi dan vendor alternatif.';
            $recommendations[] = 'Lakukan negosiasi ulang harga satuan untuk efisiensi.';
            $reallocationSuggestions[] = 'Geser sisa anggaran dari divisi surplus ke divisi defisit.';
        } else {
            $recommendations[] = 'Alokasi anggaran sudah ideal, pertahankan pengawasan.';
        }

        return json_encode([
            'warnings' => $warnings,
            'recommendations' => $recommendations,
            'reallocation_suggestions' => $reallocationSuggestions,
            'summary' => count($warnings) > 0 ? 'Ditemukan beberapa potensi risiko anggaran yang perlu segera ditangani.' : 'Anggaran event sehat dan sesuai rencana.',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
