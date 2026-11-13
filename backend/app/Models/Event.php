<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = ['name', 'total_budget', 'date'];

    protected $casts = [
        'total_budget' => 'decimal:2',
        'date' => 'date',
    ];

    public function divisions(): HasMany
    {
        return $this->hasMany(Division::class);
    }

    public function auditReports(): HasMany
    {
        return $this->hasMany(AuditReport::class);
    }
}
