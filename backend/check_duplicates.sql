SELECT code, COUNT(*) as count FROM cost_centers GROUP BY code HAVING COUNT(*) > 1;
