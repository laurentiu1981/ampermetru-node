// -----------------------------------
// Controlling LEDs over the Internet
// -----------------------------------

// Name the pins.
int cpuLed = D0; // Blue
int memLed = D2; // Green
int hddLed = D4; // Orange
int sshLed = D6; // Red
int errorLed = D6; // Red
int ampermeterPin = A0;
int activeMemCpuSsh = -1;

// Other vars.
int errorCount = 0;
int blinkLowHigh = LOW;

// This routine runs only once upon reset.
// https://www.spark.io/build/54df4d1194be4afb64000c6e#flash
void setup()
{
    // Open serial over US.
    Serial.begin(9600);
    
   // Register our Spark function here.
   Spark.function("led", ledControl);
   Spark.function("getMemCpuSsh", getMemCpuSshControl);

   // Configure the pins to be outputs.
   pinMode(cpuLed, OUTPUT);
   pinMode(memLed, OUTPUT);
   pinMode(hddLed, OUTPUT);
   pinMode(sshLed, OUTPUT);
   pinMode(ampermeterPin, OUTPUT);

   // Initialize the LEDs to be OFF.
   digitalWrite(cpuLed, LOW);
   digitalWrite(memLed, LOW);
   digitalWrite(hddLed, LOW);
   digitalWrite(sshLed, LOW);
   digitalWrite(ampermeterPin, LOW);
}


// This routine loops forever.
void loop()
{
   // Blink ssh led on error.
   if (errorCount >= 3) {
       blinkLowHigh = blinkLowHigh == LOW ? HIGH : LOW;
       digitalWrite(errorLed, blinkLowHigh);
   }

   delay(1000);
}

// Tokenize string.
char** getTokens(char buffer[], char delimiter[], int limit)
{
    char **tokens, *token;
    int i = 0;

    tokens = ( char** )malloc( limit*sizeof( char* ));
    token = strtok (buffer, delimiter);

    while (token != NULL)
    {
      tokens[i++] = token;
      token = strtok (NULL, delimiter);
    }

    return tokens;
}


int ledControl(String command)
{
    Serial.print(millis());Serial.println(": Received led (\"" + command + "\").");

    // Assume error.
    errorCount++;
    
    // command = "{CPU|MEM|HDD}|<cpu_value>|<mem_value>|<hdd_value>|<ssh_bit>|<hostname>"
    // e.g. command = "HDD|15|50|17|0"
    const char *commandCharStar = command.c_str();
    char commandChar[63];
    strncpy(commandChar, commandCharStar, sizeof commandChar - 1);
    commandChar[62] = '\0';
    char **parameters = getTokens(commandChar, "|", 10);

    char *parameterActive = parameters[0];
    float parameterCpu = atof(parameters[1]);
    float parameterMem = atof(parameters[2]);
    float parameterHdd = atof(parameters[3]);
    int parameterSsh = atoi(parameters[4]);
    char *hostname = parameters[5];
    
    // Init values.
    int cpuLedValue = LOW;
    int memLedValue = LOW;
    int hddLedValue = LOW;
    int sshLedValue = LOW;
    int ampermeterValue = 0;
    activeMemCpuSsh = -1;
    
    bool isCpu = strcmp(parameterActive, "CPU") == 0;
    bool isMemory = strcmp(parameterActive, "MEM") == 0;
    bool isHdd = strcmp(parameterActive, "HDD") == 0;
    
    // Set values.
    if (isCpu) {
        cpuLedValue = HIGH;
        activeMemCpuSsh = cpuLed;
        ampermeterValue = restartAmpermeterValue(parameterCpu);
        errorCount = 0;
    }
    if (isMemory) {
        memLedValue = HIGH;
        activeMemCpuSsh = memLed;
        ampermeterValue = restartAmpermeterValue(parameterMem);
        errorCount = 0;
    }
    if (isHdd) {
        hddLedValue = HIGH;
        activeMemCpuSsh = hddLed;
        ampermeterValue = restartAmpermeterValue(parameterHdd);
        errorCount = 0;
    }
    sshLedValue = parameterSsh >= 1 ? HIGH : LOW;
            
    // Set leds.
    digitalWrite(cpuLed, cpuLedValue);
    digitalWrite(memLed, memLedValue);
    digitalWrite(hddLed, hddLedValue);
    digitalWrite(sshLed, sshLedValue);
    analogWrite(ampermeterPin, ampermeterValue);
    
    char printMe[100];
    sprintf(printMe, "Set cpu: %d, mem: %d, hdd: %d, ssh: %d, ampermeter: %d.", cpuLedValue, memLedValue, hddLedValue, sshLedValue, ampermeterValue);
    Serial.println(printMe);
    
    free(parameters);
    
    Serial.print("Return ");Serial.println(activeMemCpuSsh);
    
    return activeMemCpuSsh;
}

int getMemCpuSshControl(String command)
{
    return activeMemCpuSsh;
}

// New percentage received. Re-adjust ampermeter.
// percentage = 0..100
int restartAmpermeterValue(float percentage)
{
    return (int) (percentage * 2.55);
}
