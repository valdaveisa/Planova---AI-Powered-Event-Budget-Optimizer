<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetItem extends Model
{
    protected $fillable = ['division_id', 'description', 'quantity', 'unit_price', 'vendor_name', 'status'];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function getTotalPriceAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
