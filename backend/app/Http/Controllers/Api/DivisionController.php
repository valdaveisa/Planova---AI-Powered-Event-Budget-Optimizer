<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DivisionController extends Controller
{
    public function index(): JsonResponse
    {
        $divisions = Division::with('budgetItems')->get();
        return response()->json($divisions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'name' => 'required|string|max:255',
            'budget_limit' => 'required|numeric|min:0',
        ]);

        $division = Division::create($validated);
        return response()->json($division, 201);
    }

    public function show(Division $division): JsonResponse
    {
        $division->load('budgetItems');
        return response()->json($division);
    }

    public function update(Request $request, Division $division): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => 'sometimes|required|exists:events,id',
            'name' => 'sometimes|required|string|max:255',
            'budget_limit' => 'sometimes|required|numeric|min:0',
        ]);

        $division->update($validated);
        return response()->json($division);
    }

    public function destroy(Division $division): JsonResponse
    {
        $division->delete();
        return response()->json(null, 204);
    }
}
