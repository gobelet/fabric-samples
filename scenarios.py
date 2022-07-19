# -*- coding: utf-8 -*-
"""
Created on Wed Jul  6 10:55:00 2022

@author: Gaspard
"""

##Imports
from tkinter import *
import os
from functools import partial

n_tickets = 3
n_queue = 0
rank = 0

##Main functions
def demonstration():
    """
    1st window
    """
    global frm
    global folder
    global path
    
    path = "/home/gwenaelle/Logiciels/fabric-samples/"
    
    frm = Frame(root)
    frm.grid()
 
    Label(frm, text = "Demonstration of our hyperledger application").grid(column=0, row=0)
    Label(frm, text="").grid(column=0, row=1)
    Label(frm, text="Enter working directory path").grid(column=0, row=2)
    
    folder = Entry(frm)
    #default path to test-network
    folder.insert(0, path)
    


    folder.grid(row=3,column=0)
    Button(frm, text='Go',command=partial(start,0), bg='green').grid(row=4,column=0)
    Label(frm, text="").grid(column=0, row=5)
    Button(frm, text="Quit", command=_quit, bg = 'red').grid(column=0, row=6)    
    
def start(mode):
    """
    2nd window
    """
    global entry
    global frm
    global var
    global path
    global n_tickets, n_queue, rank
    
    n_tickets = 3
    n_queue = 0
    rank = 0
    
    if mode == 0:
    	path = folder.get()
    	os.chdir(path+"test-network/") #we go into test-network
    	print("Initializing blockchain")
    	os.system("./network.sh up createChannel -c mychannel -ca")
    	os.system("./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript")
    	print("Done")
    
    frm.destroy()
    frm = Frame(root)
    frm.grid()
 
    Label(frm, text = "Welcome to our queuing system").grid(column=0, row=0)
    Label(frm, text = "You may try various scenarios").grid(column=0, row=1)
    Label(frm, text="").grid(column=0, row=2)
    #Label(frm, text="Enter either  'shotgun & pay'  or  'shotgun & pay error'  or  'shotgun & cancel' ").grid(column=0, row=3)
    
    var = IntVar()
    Radiobutton(frm, text="Shotgun & pay", variable=var, value=1).grid(column=0,row=3)
    Radiobutton(frm, text="Shotgun & wait", variable=var, value=2).grid(column=0,row=4)
    Radiobutton(frm, text="Shotgun & cancel", variable=var, value=3).grid(column=0,row=5)
    Label(frm, text="").grid(column=0, row=6)
    Button(frm, text='Start',command=partial(scenarios,0), bg='green').grid(row=7,column=0)
    Label(frm, text="").grid(column=0, row=8)
    Button(frm, text="Quit", command=_quit, bg = 'red').grid(column=0, row=9)
  
def _quit():
    """
    quit button
    """
    global path

    os.chdir(path+"test-network/")
    os.system("./network.sh down")
    os.chdir("../asset-transfer-basic/application-javascript")
    os.system("rm -r wallet")
    root.quit()     
    root.destroy()

def scenarios(mode):
    """
    3rd window
    """
    global frm
    global scenario
    global n_queue
    global rank
    global n_tickets
    global path
    
    if mode==0:
        print("Loading scenario...")
        scenario_map = ['shotgun & pay', 'shotgun & pay error', 'shotgun & cancel']
        scenario = scenario_map[var.get()-1]
        
        
    if scenario=='shotgun & pay' or scenario=='shotgun & cancel':
        #initialization with 0 in queue
        filename = 'init.js 3'

        os.chdir(path+"/asset-transfer-basic/application-javascript")
        os.system("node "+filename)
    
    if scenario=='shotgun & pay error':
        #initialization with n in queue
        n_queue = n_tickets
        rank = n_tickets
        filename = 'init.js 3'
        os.chdir(path+"/asset-transfer-basic/application-javascript")
        os.system("node "+filename)
        os.system("node enterQueue.js client1")
        os.system("node enterQueue.js client2")
        os.system("node enterQueue.js client3")
    
    if mode==0:
        print("")
        print("Scenario loaded.")
        print("")

    
    frm.destroy()
    frm = Frame(root)
    frm.grid()

    Label(frm, text = "Chosen scenario: "+ scenario).grid(column=0, row=0)
    Label(frm, text = "You may now interact with blockchain").grid(column=0, row=1)
    Label(frm, text="").grid(column=0, row=2)
    Button(frm, text='Shotgun',command=partial(shotgun,0), bg='green').grid(row=3,column=0)
    Label(frm, text="").grid(column=0, row=4)
    Button(frm, text='Quit',command=_quit, bg='red').grid(row=5,column=0)  

def shotgun(mode):
    """
    4th window

    """
    global frm
    global n_queue
    global rank
    global n_tickets
    global path
    
    if mode==0:
        print("Trying shotgun")
        filename = 'enterQueue.js client0' #shotgun command
        os.chdir(path+"asset-transfer-basic/application-javascript")
        os.system("node "+filename)
        n_queue+=1
        rank+=1
        print("Shotgun successful")
        print("")
    
    frm.destroy()
    frm = Frame(root)
    frm.grid()
    
    #code suivant utile si on sait return rank et n_tickets depuis la blockchain
    '''
    n_tickets = get_tickets()
    rank = get_rank()
    '''
    #en attendant :    
    Label(frm, text = "Current rank: "+ str(rank)).grid(column=0, row=0)
    Label(frm, text = "Number of tickets left : "+str(n_tickets)).grid(column=0, row=1)
    Label(frm, text="").grid(column=0, row=2)
    b = Button(frm, text='Pay',command=pay, bg='green', state = DISABLED)
    
    if rank <= n_tickets:
        b['state']=NORMAL
    b.grid(row=3,column=0)
    Label(frm, text="").grid(column=0, row=4)
    Button(frm, text='Refresh',command=refresh, bg='orange').grid(row=5,column=0)
    Label(frm, text="").grid(column=0, row=6)
    Button(frm, text='Cancel',command=cancel, bg='blue').grid(row=7,column=0)

def refresh():
    global n_queue
    global rank
    global n_tickets
    global path
    """
    simulating refreshing and canceling of a guy
    """
    print("Refreshing")
    if (scenario=="shotgun & pay error") and (rank > n_tickets):
        filename = 'leaveQueue.js client1' #cancel of a another guy command
        os.chdir(path+"asset-transfer-basic/application-javascript")
        os.system("node "+filename)
        n_queue-=1
        rank-=1
    print("Done")
    print("")
    shotgun(1)
    

    
def pay():
    """
    succesful payment
    5th window
    """
    global frm
    global n_tickets
    global n_queue
    global path
    
    print("Paying:")
    print("")
    filename = 'pay.js client0' #pay
    os.chdir(path+"asset-transfer-basic/application-javascript")
    os.system("node "+filename)
    print("Done")
    
    n_tickets -= 1
    n_queue -= 1
    
    frm.destroy()
    frm = Frame(root)
    frm.grid()
    
    #code suivant utile si on sait return rank et n_tickets depuis la blockchain
    '''
    n_tickets = get_tickets()
    rank = get_rank()
    '''
    #en attendant :    
    Label(frm, text = "Successfully paid!").grid(column=0, row=0)
    Label(frm, text = "Here is your ticket").grid(column=0, row=1)
    Label(frm, text="").grid(column=0, row=2)
    Label(frm, text="TICKET").grid(column=0, row=3)
    Label(frm, text="").grid(column=0, row=4)
    Button(frm, text='New scenario',command=partial(start, 1), bg='blue').grid(row=5,column=0)

def cancel():
    global n_queue
    global rank
    global path
    """
    simulating canceling of user
    """
    
    filename = 'leaveQueue.js client0'
    os.chdir(path+"asset-transfer-basic/application-javascript")
    os.system("node "+filename)
    n_queue-=1
    print("Done")
    print("")
    start(1)


##Launching of the GUI
root = Tk()
root.title("Database systems project")
root.geometry("500x300")
demonstration()
root.mainloop()
