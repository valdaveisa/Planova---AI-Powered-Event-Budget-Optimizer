<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BudgetItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BudgetItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = BudgetItem::with('division')->get();
        return response()->json($items);
    }

use App\Models\BudgetItem;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BudgetItemController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'description' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'vendor_name' => 'nullable|string|max:255',
            'status' => 'sometimes|in:Draft,Pending Audit,Approved',
        ]);

        $division = Division::findOrFail($validated['division_id']);
        $totalSpent = $division->budgetItems()->sum(\DB::raw('quantity * unit_price'));
        $itemTotal = $validated['quantity'] * $validated['unit_price'];

        if (($totalSpent + $itemTotal) > $division->budget_limit) {
            return response()->json(['message' => 'Budget limit for this division exceeded!'], 422);
        }

        $item = BudgetItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(BudgetItem $budgetItem): JsonResponse
    {
        $budgetItem->load('division');
        return response()->json($budgetItem);
    }

    public function update(Request $request, BudgetItem $budgetItem): JsonResponse
    {
        $validated = $request->validate([
            'division_id' => 'sometimes|required|exists:divisions,id',
            'description' => 'sometimes|required|string|max:255',
            'quantity' => 'sometimes|required|integer|min:1',
            'unit_price' => 'sometimes|required|numeric|min:0',
            'vendor_name' => 'nullable|string|max:255',
            'status' => 'sometimes|in:Draft,Pending Audit,Approved',
        ]);

        $budgetItem->update($validated);
        return response()->json($budgetItem);
    }

    public function destroy(BudgetItem $budgetItem): JsonResponse
    {
        $budgetItem->delete();
        return response()->json(null, 204);
    }
}
