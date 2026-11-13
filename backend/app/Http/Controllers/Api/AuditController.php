<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditReport;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditController extends Controller
{
    public function index(): JsonResponse
    {
        $reports = AuditReport::with('event')->latest()->get();
        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
        ]);

        $event = Event::with('divisions.budgetItems')->findOrFail($validated['event_id']);
        
        // Prepare data for AI audit
        $auditData = $this->prepareAuditData($event);
        
        // Call AI service (placeholder for Gemini integration)
        $aiSuggestion = $this->callAiAudit($auditData);
        
        // Save audit report
        $report = AuditReport::create([
            'event_id' => $event->id,
            'raw_json' => $auditData,
            'ai_suggestion' => $aiSuggestion,
        ]);

        return response()->json($report, 201);
    }

    public function show(AuditReport $auditReport): JsonResponse
    {
        $auditReport->load('event');
        return response()->json($auditReport);
    }

    public function destroy(AuditReport $auditReport): JsonResponse
    {
        $auditReport->delete();
        return response()->json(null, 204);
    }

    private function prepareAuditData(Event $event): array
    {
        $divisions = $event->divisions->map(function ($division) {
            $items = $division->budgetItems->map(function ($item) {
                return [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->totalPrice,
                    'vendor_name' => $item->vendor_name,
                    'status' => $item->status,
                ];
            });

            $divisionTotal = $items->sum('total_price');
            $budgetUsage = $division->budget_limit > 0 ? ($divisionTotal / $division->budget_limit) * 100 : 0;

            return [
                'id' => $division->id,
                'name' => $division->name,
                'budget_limit' => $division->budget_limit,
                'total_spent' => $divisionTotal,
                'budget_usage_percent' => round($budgetUsage, 2),
                'items' => $items,
            ];
        });

        $totalBudget = $event->total_budget;
        $totalSpent = $divisions->sum('total_spent');
        $overallUsage = $totalBudget > 0 ? ($totalSpent / $totalBudget) * 100 : 0;

        return [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'total_budget' => $event->total_budget,
                'date' => $event->date,
                'total_spent' => $totalSpent,
                'overall_usage_percent' => round($overallUsage, 2),
            ],
            'divisions' => $divisions,
        ];
    }

    private function callAiAudit(array $data): string
    {
        // Placeholder for Gemini API integration
        // This would send the data to Google Gemini and return the analysis
        
        $prompt = $this->buildAuditPrompt($data);
        
        // TODO: Integrate with Google Gemini API
        // For now, return a mock analysis
        return $this->generateMockAnalysis($data);
    }

    private function buildAuditPrompt(array $data): string
    {
        $jsonData = json_encode($data, JSON_PRETTY_PRINT);
        
        return "Sebagai auditor keuangan untuk event {$data['event']['name']}, analisis data RAB berikut:\n\n{$jsonData}\n\nBerikan analisis dalam bahasa Indonesia mencakup:
1. Deteksi harga vendor yang tidak wajar (markup)
2. Analisa proporsi anggaran per divisi (warning jika >30% total budget)
3. Identifikasi item duplikat antar divisi
4. Rekomendasi realokasi dana

Format output: JSON dengan struktur:
{
  \"warnings\": [],
  \"recommendations\": [],
  \"reallocation_suggestions\": [],
  \"summary\": \"\"
}\n
Jika Anda tidak memiliki akses API untuk berpikir, berikan analisis berdasarkan data yang diberikan.
";
    }

    private function generateMockAnalysis(array $data): string
    {
        $warnings = [];
        $recommendations = [];
        $reallocationSuggestions = [];

        // Check division budget proportions
        foreach ($data['divisions'] as $division) {
            if ($division['budget_usage_percent'] > 100) {
                $warnings[] = "Divisi {$division['name']} melebihi batas anggaran ({$division['budget_usage_percent']}%)";
            } elseif ($division['budget_usage_percent'] > 80) {
                $warnings[] = "Divisi {$division['name']} mendekati batas anggaran ({$division['budget_usage_percent']}%)";
            }

            // Check if division proportion > 30% of total budget
            $totalBudget = $data['event']['total_budget'];
            $divisionProportion = ($division['total_spent'] / $totalBudget) * 100;
            if ($divisionProportion > 30) {
                $warnings[] = "Divisi {$division['name']} mengonsumsi {$divisionProportion}% dari total budget (lebih dari 30%)";
            }
        }

        // Check for duplicate items across divisions
        $allItems = [];
        foreach ($data['divisions'] as $division) {
            foreach ($division['items'] as $item) {
                $key = strtolower($item['description']);
                if (!isset($allItems[$key])) {
                    $allItems[$key] = [];
                }
                $allItems[$key][] = [
                    'division' => $division['name'],
                    'item' => $item
                ];
            }
        }

        foreach ($allItems as $description => $occurrences) {
            if (count($occurrences) > 1) {
                $divNames = array_map(fn($o) => $o['division'], $occurrences);
                $warnings[] = "Item duplikat terdeteksi: '{$description}' ditemukan di divisi: " . implode(', ', $divNames);
            }
        }

        // Add some recommendations
        if (count($warnings) > 0) {
            $recommendations[] = "Tinjau kembali item-item yang terdeteksi duplikat untuk konsolidasi vendor";
            $recommendations[] = "Evaluasi ulang divisi dengan penggunaan anggaran > 80%";
            $reallocationSuggestions[] = "Pertimbangkan mengurangi anggaran divisi non-prioritas untuk menutupi deficit";
        } else {
            $recommendations[] = "Anggaran terlihat seimbang, lanjutkan monitoring berkala";
        }

        return json_encode([
            'warnings' => $warnings,
            'recommendations' => $recommendations,
            'reallocation_suggestions' => $reallocationSuggestions,
            'summary' => count($warnings) > 0 
                ? "Ditemukan " . count($warnings) . " potensi masalah yang perlu ditinjau" 
                : "Tidak ditemukan masalah signifikan pada RAB ini",
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
