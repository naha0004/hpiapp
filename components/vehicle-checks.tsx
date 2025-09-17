"use client";

import React from "react";
import { Search, Loader2, Calendar, Info, AlertTriangle, CheckCircle2, Clock, Car, Droplet, Hash, Bell, Plus } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Button } from "@/components/ui/button";
import { formatRegistration, api, handleApiError } from "@/lib/api";
import { motion } from "framer-motion";
import { EnhancedReminders } from "@/components/enhanced-reminders";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Defect {
  text: string;
  type: string;
}

interface Advisory {
  text: string;
  type: string;
}

interface MOTTest {
  completedDate: string;
  testResult: string;
  expiryDate: string;
  odometerValue: number;
  odometerUnit: string;
  motTestNumber: string;
  defects: Defect[];
  advisories: Advisory[];
}

interface VehicleData {
  registration: string;
  make: string;
  model: string;
  firstUsedDate: string;
  fuelType: string;
  primaryColour: string;
  motTests: MOTTest[];
  // DVLA Official Data
  dvlaData?: {
    taxStatus?: string;
    taxDueDate?: string;
    motStatus?: string;
    motExpiryDate?: string;
    yearOfManufacture?: number;
    cylinderCapacity?: number;
    co2Emissions?: number;
    euroStatus?: string;
    markedForExport?: boolean;
    wheelplan?: string;
    dateOfLastV5CIssued?: string;
  };
  dvlaLegalStatus?: {
    isLegal: boolean;
    issues: string[];
    warnings: string[];
  };
}

const MotionDiv = motion.div;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function MOTChecks(): React.JSX.Element {
  const [registration, setRegistration] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicleData, setVehicleData] = React.useState<VehicleData | null>(null);
  const [debugMode] = React.useState(process.env.NODE_ENV === 'development');
  const [showReminders, setShowReminders] = React.useState(false);
  const { data: session } = useSession();

  async function searchVehicle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!registration) return;
    setIsLoading(true);

    try {
      console.log('Fetching data for registration:', registration);
      const response = await fetch(`/api/vehicles/search?registration=${formatRegistration(registration)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch vehicle data");
      }

      // Validate the response data structure
      if (!data.data || typeof data.data !== 'object') {
        throw new Error("Invalid response format from API");
      }

      // Validate MOT tests array
      if (!Array.isArray(data.data.motTests)) {
        console.warn('No MOT tests found in response:', data.data);
        data.data.motTests = [];
      }

      console.log('Received vehicle data:', {
        registration: data.data.registration,
        make: data.data.make,
        model: data.data.model,
        motTestsCount: data.data.motTests?.length,
        hasDefects: data.data.motTests?.some((t: MOTTest) => t.defects?.length > 0),
        hasAdvisories: data.data.motTests?.some((t: MOTTest) => t.advisories?.length > 0)
      });

      setVehicleData(data.data);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while searching for the vehicle");
      setVehicleData(null);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getStatusColor(test: MOTTest) {
    if (!test.expiryDate) return 'gray';
    return new Date(test.expiryDate) > new Date() ? 'emerald' : 'red';
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#f8fafc]">
      <div className="container relative mx-auto py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <form onSubmit={searchVehicle} className={`w-full max-w-md mx-auto ${vehicleData ? 'mb-8 transform -translate-y-4 scale-75' : ''} transition-all duration-500`}>
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`bg-gradient-to-br from-[#ffd234] via-[#ffdc6c] to-[#ffd234] p-8 rounded-3xl border-2 border-black/5 shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-xl transform transition-all duration-300 relative ${vehicleData ? 'hover:scale-105 opacity-90 hover:opacity-100' : 'hover:scale-105'}`}
            >
              <h2 className="text-black/80 text-2xl font-bold mb-6 text-center">
                MOT Check
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={registration}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (/^[A-Z0-9 ]*$/.test(value) && value.length <= 8) {
                      setRegistration(value);
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text").toUpperCase();
                    if (/^[A-Z0-9 ]*$/.test(text) && text.length <= 8) {
                      setRegistration(text);
                    }
                  }}
                  className="w-full text-center bg-white/20 text-black uppercase text-5xl font-bold tracking-[0.25em] h-20 focus:outline-none focus:ring-4 focus:ring-black/10 rounded-2xl placeholder:text-black/30 shadow-inner"
                  placeholder="AB12 CDE"
                  maxLength={8}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="absolute inset-x-0 -bottom-px h-12 bg-gradient-to-t from-[#ffd234] to-transparent pointer-events-none"></div>
              </div>
              {error && (
                <MotionDiv
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50/90 backdrop-blur-xl border border-red-200 rounded-2xl text-red-600 text-sm flex items-start gap-2"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </MotionDiv>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-black/90 text-white hover:bg-black h-14 rounded-2xl transition-all duration-300 hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Search Vehicle
              </Button>
            </MotionDiv>
          </form>

          {vehicleData && (
            <div className="w-full max-w-4xl mx-auto">
              {debugMode && (
                <div className="bg-gray-100 p-4 rounded-xl text-sm space-y-2 mb-6">
                  <p>Debug Info:</p>
                  <p>Total MOT Tests: {vehicleData.motTests?.length || 0}</p>
                  <p>Latest Test Date: {vehicleData.motTests?.[0]?.completedDate ? new Date(vehicleData.motTests[0].completedDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              )}

              {/* DVLA Legal Status Warnings */}
              {vehicleData.dvlaLegalStatus && !vehicleData.dvlaLegalStatus.isLegal && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-red-900 font-semibold mb-2">⚠️ Vehicle Not Road Legal</h3>
                      <div className="space-y-1">
                        {vehicleData.dvlaLegalStatus.issues.map((issue, index) => (
                          <p key={index} className="text-red-700 text-sm">• {issue}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DVLA Warnings (non-critical) */}
              {vehicleData.dvlaLegalStatus && vehicleData.dvlaLegalStatus.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-yellow-900 font-semibold mb-2">⚠️ Important Notices</h3>
                      <div className="space-y-1">
                        {vehicleData.dvlaLegalStatus.warnings.map((warning, index) => (
                          <p key={index} className="text-yellow-700 text-sm">• {warning}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Details Header */}
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-200 shadow-lg mb-6">
                <div className="px-6 py-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
                      <p className="text-gray-500">Complete vehicle information and MOT history</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#ffd234] via-[#ffdc6c] to-[#ffd234] px-4 py-2 rounded-xl border border-black/5 shadow-lg">
                      <span className="text-xl font-bold text-black/80 tracking-wider">{vehicleData.registration}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Car className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Vehicle Information</h3>
                        {vehicleData.dvlaData && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            DVLA Official
                          </span>
                        )}
                      </div>
                      
                      {/* Vehicle Details */}
                      <div className="space-y-4">
                        
                        {/* Vehicle Details */}
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-gray-900">
                            {vehicleData.make} {vehicleData.model}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Droplet className="w-3 h-3" />
                            <span>Color: {vehicleData.primaryColour}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Hash className="w-3 h-3" />
                            <span>Fuel: {vehicleData.fuelType}</span>
                          </div>
                          {vehicleData.dvlaData?.yearOfManufacture && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>Year: {vehicleData.dvlaData.yearOfManufacture}</span>
                            </div>
                          )}
                          {vehicleData.dvlaData?.cylinderCapacity && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Hash className="w-3 h-3" />
                              <span>Engine: {vehicleData.dvlaData.cylinderCapacity}cc</span>
                            </div>
                          )}
                          {vehicleData.dvlaData?.co2Emissions && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Droplet className="w-3 h-3" />
                              <span>CO₂: {vehicleData.dvlaData.co2Emissions}g/km</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DVLA Tax Status */}
                    {vehicleData.dvlaData?.taxStatus && (
                      <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            vehicleData.dvlaData.taxStatus === 'Taxed' 
                              ? 'bg-green-100' 
                              : vehicleData.dvlaData.taxStatus === 'SORN'
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                          }`}>
                            <CheckCircle2 className={`w-5 h-5 ${
                              vehicleData.dvlaData.taxStatus === 'Taxed' 
                                ? 'text-green-600' 
                                : vehicleData.dvlaData.taxStatus === 'SORN'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`} />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900">Tax Status</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            DVLA Official
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              vehicleData.dvlaData.taxStatus === 'Taxed' 
                                ? 'bg-green-100 text-green-700' 
                                : vehicleData.dvlaData.taxStatus === 'SORN'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {vehicleData.dvlaData.taxStatus}
                            </span>
                          </div>
                          {vehicleData.dvlaData.taxDueDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Due Date:</span>
                              <span className="text-sm font-medium">
                                {new Date(vehicleData.dvlaData.taxDueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">MOT Status</h3>
                        {vehicleData.dvlaData?.motStatus && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            DVLA Official
                          </span>
                        )}
                      </div>
                      
                      {/* DVLA MOT Status (Official) */}
                      {vehicleData.dvlaData?.motStatus && (
                        <div className="space-y-3 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-900">Official DVLA Status:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                vehicleData.dvlaData.motStatus === 'Valid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {vehicleData.dvlaData.motStatus}
                              </span>
                            </div>
                            {vehicleData.dvlaData.motExpiryDate && (
                              <div className="flex items-center gap-2 text-sm text-blue-700">
                                <Calendar className="w-3 h-3" />
                                <span>Expires: {new Date(vehicleData.dvlaData.motExpiryDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* DVSA MOT History */}
                      {vehicleData.motTests?.[0]?.expiryDate ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">MOT Test History:</div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                            new Date(vehicleData.motTests[0].expiryDate) > new Date()
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {new Date(vehicleData.motTests[0].expiryDate) > new Date() ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-medium">MOT Valid</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-medium">MOT Expired</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>Last Test Expires: {formatDate(vehicleData.motTests[0].expiryDate)}</span>
                          </div>
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>Total Tests: {vehicleData.motTests.length}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">No valid MOT found</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Reminders Section */}
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Smart Reminders</h3>
                          <p className="text-sm text-gray-600">Never miss MOT or tax deadlines</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowReminders(!showReminders)}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        {showReminders ? (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Hide Reminders
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Set Reminders
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {!showReminders && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Quick MOT Reminder */}
                        {(vehicleData.dvlaData?.motExpiryDate || vehicleData.motTests?.[0]?.expiryDate) && (
                          <div className="p-3 bg-white/70 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">MOT Reminder</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                Due: {formatDate(vehicleData.dvlaData?.motExpiryDate || vehicleData.motTests?.[0]?.expiryDate || '')}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Quick Tax Reminder */}
                        {vehicleData.dvlaData?.taxDueDate && (
                          <div className="p-3 bg-white/70 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-700">Tax Reminder</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                Due: {formatDate(vehicleData.dvlaData.taxDueDate)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mileage Chart */}
                  {vehicleData.motTests?.length > 0 && (
                    <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Mileage History</h3>
                      <div className="h-[300px]">
                        <Line
                          data={{
                            labels: [...new Set(vehicleData.motTests
                              .filter(test => test.completedDate && !isNaN(new Date(test.completedDate).getTime()))
                              .sort((a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime())
                              .map(test => {
                                const date = new Date(test.completedDate);
                                return date.toLocaleDateString('en-GB', {
                                  month: 'short',
                                  year: 'numeric'
                                });
                              }))],
                            datasets: [{
                              label: 'Mileage',
                              data: vehicleData.motTests
                                .filter(test => test.completedDate && !isNaN(new Date(test.completedDate).getTime()))
                                .sort((a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime())
                                .map(test => test.odometerValue),
                              borderColor: '#6366f1',
                              backgroundColor: '#6366f1',
                              tension: 0.4,
                              pointRadius: 6,
                              pointHoverRadius: 8
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Mileage'
                                },
                                ticks: {
                                  callback: function(value) {
                                    return value.toLocaleString();
                                  }
                                }
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Test Date'
                                },
                                grid: {
                                  display: true
                                },
                                ticks: {
                                  autoSkip: false,
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              }
                            },
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `Mileage: ${context.parsed.y.toLocaleString()}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MOT History Section */}
              <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-black/5 shadow-lg">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gray-100 rounded-2xl">
                      <Calendar className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">MOT History</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500">
                          {vehicleData.motTests?.length 
                            ? `${vehicleData.motTests.length} test${vehicleData.motTests.length === 1 ? '' : 's'} on record`
                            : 'No MOT tests found'
                          }
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                          <button
                            onClick={() => {
                              console.log('MOT History:', {
                                tests: vehicleData.motTests,
                                count: vehicleData.motTests?.length,
                                firstTestDate: vehicleData.motTests?.[0]?.completedDate,
                                isArray: Array.isArray(vehicleData.motTests)
                              });
                            }}
                            className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Debug MOT Data
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {(!Array.isArray(vehicleData.motTests) || vehicleData.motTests.length === 0) ? (
                      <div className="text-center py-8">
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 inline-block">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500 font-medium">No MOT history found</p>
                          <p className="text-sm text-gray-400 mt-2">
                            This could be because the vehicle is new or exempt from MOT testing.
                          </p>
                        </div>
                      </div>
                    ) : (
                      vehicleData.motTests.map((test: MOTTest, index: number) => (
                        <MotionDiv
                          key={test.motTestNumber || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(index * 0.1, 1) }}
                          className="group bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                                  test.testResult === "PASSED" 
                                    ? "bg-emerald-100 text-emerald-600" 
                                    : "bg-red-100 text-red-600"
                                }`}>
                                  {test.testResult === "PASSED" ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                    <AlertTriangle className="w-6 h-6" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">Test #{vehicleData.motTests.length - index}</h4>
                                  <p className="text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(test.completedDate)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <span className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                  test.testResult === "PASSED"
                                    ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
                                    : "bg-red-100 text-red-700 group-hover:bg-red-200"
                                }`}>
                                  {test.testResult}
                                </span>
                                {test.motTestNumber && (
                                  <p className="text-xs text-gray-400 mt-1">#{test.motTestNumber.slice(-6)}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200/50">
                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                  <Hash className="w-4 h-4" />
                                  <span className="text-sm font-medium">Mileage</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">
                                  {test.odometerValue.toLocaleString()} {test.odometerUnit}
                                </p>
                              </div>
                              
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200/50">
                                <div className="flex items-center gap-2 text-purple-600 mb-2">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm font-medium">Valid Until</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">
                                  {test.expiryDate ? formatDate(test.expiryDate) : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {(test.defects.length > 0 || test.advisories?.length > 0) && (
                              <div className="border-t border-gray-100 pt-6 mt-6 space-y-6">
                                {test.defects.length > 0 && (
                                  <div>
                                    <h5 className="flex items-center gap-2 text-red-600 font-medium mb-4">
                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                      Failed Items
                                    </h5>
                                    <div className="space-y-2">
                                      {test.defects.map((defect: Defect, i: number) => (
                                        <div key={i} className="p-3 bg-red-50/50 rounded-xl">
                                          <p className="text-sm text-gray-700">{defect.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {test.advisories?.length > 0 && (
                                  <div>
                                    <h5 className="flex items-center gap-2 text-amber-600 font-medium mb-4">
                                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                                      Advisory Items
                                    </h5>
                                    <div className="space-y-2">
                                      {test.advisories.map((advisory: Advisory, i: number) => (
                                        <div key={i} className="p-3 bg-amber-50/50 rounded-xl">
                                          <p className="text-sm text-gray-700">{advisory.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {!test.defects.length && !test.advisories?.length && (
                              <div className="border-t border-gray-100 pt-6 mt-6">
                                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl text-emerald-700">
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span className="font-medium">No defects or advisories found</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </MotionDiv>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Reminders Modal/Overlay */}
          {showReminders && vehicleData && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Vehicle Reminders</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowReminders(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                  <EnhancedReminders 
                    vehicleData={{
                      registration: vehicleData.registration,
                      make: vehicleData.make,
                      model: vehicleData.model,
                      year: vehicleData.dvlaData?.yearOfManufacture,
                      dvlaData: vehicleData.dvlaData,
                      motTests: vehicleData.motTests
                    }}
                    userId={session?.user?.id || "demo-user"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Terms Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
            <p>
              Data provided by DVLA and DVSA. We exclude liability for data inaccuracies. 
              <Link href="/terms" target="_blank" className="hover:text-gray-700 underline ml-2">
                Terms & Conditions
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
