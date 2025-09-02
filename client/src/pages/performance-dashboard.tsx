import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Database, Zap, BarChart3, TrendingUp, Server } from 'lucide-react';

interface PerformanceMetrics {
  databaseStats: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    indexUsage: number;
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizeBytes: number;
      indexCount: number;
    }>;
  };
  apiPerformance: {
    endpoints: Array<{
      route: string;
      averageResponseTime: number;
      requestCount: number;
      errorRate: number;
    }>;
  };
  systemHealth: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    uptime: number;
  };
  optimizationSuggestions: Array<{
    type: 'index' | 'query' | 'cache' | 'cleanup';
    severity: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>;
}

export default function PerformanceDashboard() {
  const [optimizingIndex, setOptimizingIndex] = useState<string | null>(null);

  // Fetch performance metrics with error handling
  const { data: metrics, isLoading, error, refetch } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/performance/metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const runOptimization = async (type: string) => {
    setOptimizingIndex(type);
    try {
      const response = await fetch(`/api/performance/optimize/${type}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        // Refresh metrics after optimization
        refetch();
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setOptimizingIndex(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics || error) {
    return (
      <div className="space-y-6">
        {/* NAVIGATION BAR WITH BACK BUTTON */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium shadow-sm">
                ← Back to Dashboard
              </button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800">Performance Dashboard</h2>
          </div>
        </div>
        
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-500">Performance metrics unavailable</p>
          <p className="text-sm text-gray-400 mt-2">
            {error ? `Error: ${error.message}` : 'Unable to load performance data'}
          </p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            <BarChart3 className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NAVIGATION BAR WITH BACK BUTTON */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium shadow-sm">
                ← Back to Dashboard
              </button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800">Performance Dashboard</h2>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.databaseStats.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.databaseStats.averageQueryTime}ms avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth.memoryUsage}%</div>
            <Progress value={metrics.systemHealth.memoryUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth.cpuUsage}%</div>
            <Progress value={metrics.systemHealth.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{formatUptime(metrics.systemHealth.uptime)}</div>
            <p className="text-xs text-muted-foreground">
              System running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Database Performance</CardTitle>
          <CardDescription>
            Query performance and table statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Query Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Queries:</span>
                  <span className="font-medium">{metrics.databaseStats.totalQueries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Query Time:</span>
                  <span className="font-medium">{metrics.databaseStats.averageQueryTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Slow Queries (&gt;1s):</span>
                  <span className={`font-medium ${metrics.databaseStats.slowQueries > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.databaseStats.slowQueries}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Index Usage:</span>
                  <span className="font-medium">{metrics.databaseStats.indexUsage}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Table Statistics</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.databaseStats.tableStats.map((table, index) => (
                  <div key={index} className="border rounded p-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{table.tableName}</div>
                        <div className="text-xs text-gray-500">
                          {table.rowCount.toLocaleString()} rows, {table.indexCount} indexes
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">{formatBytes(table.sizeBytes)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle>API Performance</CardTitle>
          <CardDescription>
            Response times and error rates for key endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Endpoint</th>
                  <th className="text-right p-2">Avg Response Time</th>
                  <th className="text-right p-2">Request Count</th>
                  <th className="text-right p-2">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.apiPerformance.endpoints.map((endpoint, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{endpoint.route}</td>
                    <td className="p-2 text-right">
                      <span className={endpoint.averageResponseTime > 1000 ? 'text-red-600' : 
                        endpoint.averageResponseTime > 500 ? 'text-yellow-600' : 'text-green-600'}>
                        {Math.round(endpoint.averageResponseTime)}ms
                      </span>
                    </td>
                    <td className="p-2 text-right">{endpoint.requestCount.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={endpoint.errorRate > 5 ? 'text-red-600' : 
                        endpoint.errorRate > 1 ? 'text-yellow-600' : 'text-green-600'}>
                        {endpoint.errorRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Suggestions</CardTitle>
          <CardDescription>
            Automated recommendations to improve system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.optimizationSuggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-white ${getSeverityColor(suggestion.severity)}`}
                      >
                        {suggestion.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium capitalize">{suggestion.type} Optimization</span>
                    </div>
                    <p className="text-sm mb-2">{suggestion.description}</p>
                    <p className="text-xs text-gray-500">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Expected Impact: {suggestion.impact}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runOptimization(suggestion.type)}
                    disabled={optimizingIndex === suggestion.type}
                  >
                    {optimizingIndex === suggestion.type ? (
                      <>
                        <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full mr-1"></div>
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Apply Fix
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {metrics.optimizationSuggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p>System is running optimally!</p>
                <p className="text-sm">No performance issues detected.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}